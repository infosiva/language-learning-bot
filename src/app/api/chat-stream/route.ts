import { NextRequest } from 'next/server'

const TECH_LANGS = ['Python', 'JavaScript', 'SQL', 'Prompt Engineering', 'AI Concepts']

interface InterviewProfile {
  jobTitle?: string
  jobDescription?: string
  targetCompany?: string
  yearsExp?: string
  skills?: string
  interviewType?: string
}

// ── System prompt builders (same as chat/route.ts) ───────────────────────────

function buildSystem(language: string, native: string, level: string, mode: string, interviewProfile: InterviewProfile | null): string {
  const isTech = TECH_LANGS.includes(language)

  if (mode === 'interview') {
    const roleCtx = interviewProfile?.jobTitle ? `The candidate is applying for a **${interviewProfile.jobTitle}** role` : 'The candidate has not specified a target role'
    const companyCtx = interviewProfile?.targetCompany ? ` at **${interviewProfile.targetCompany}**` : ''
    const expCtx = interviewProfile?.yearsExp ? ` with **${interviewProfile.yearsExp} years** of experience` : ''
    const skillsCtx = interviewProfile?.skills ? `\nCANDIDATE SKILLS CLAIMED: ${interviewProfile.skills} — probe these directly.` : ''
    const jdCtx = interviewProfile?.jobDescription ? `\nJOB DESCRIPTION:\n${interviewProfile.jobDescription}` : ''
    return `You are an expert interviewer. ${roleCtx}${companyCtx}${expCtx}.${skillsCtx}${jdCtx}
Ask exactly ONE question per turn. After every answer give structured feedback with score /10.`
  }

  if (isTech) {
    return `You are SpeakFast AI, an expert ${language} tutor. The student is ${level} level, native language: ${native}.
Explain with real-world examples, runnable code snippets, and practical exercises. Keep responses focused and encouraging.`
  }

  const modeInstructions: Record<string, string> = {
    conversation: `Have a natural, flowing conversation in ${language}. Gently correct mistakes with: ✓ Better: [correction]. Introduce vocabulary naturally.`,
    vocabulary: `Focus on vocabulary building. Each response: introduce 3-5 new words with pronunciation hint, meaning in ${native}, and an example sentence. Quiz the student on previous words.`,
    grammar: `Focus on one grammar concept at a time. Explain in ${native}, give 3 examples in ${language}, then ask the student to make their own sentence. Correct and explain mistakes.`,
    quiz: `Run a quiz! Ask questions in ${language} appropriate for ${level} level. After each answer: ✓ Correct! or ✗ The answer is: [correct answer] [explanation]. Keep score.`,
    translate: `Practice translation. Give a sentence in ${native} and ask the student to translate to ${language}. Show the ideal translation and explain differences.`,
    story: `Tell an interactive story in ${language} at ${level} level. After each segment, ask the student to choose what happens next or describe something in ${language}.`,
  }

  return `You are SpeakFast AI, a warm and encouraging ${language} tutor. Student native language: ${native}, level: ${level}.

${modeInstructions[mode] || modeInstructions.conversation}

Rules:
- ${level === 'Beginner' ? `Use simple ${language} with ${native} translations in [brackets]. Be very encouraging.` : ''}
- ${level === 'Intermediate' ? `Balance ${language} and ${native}. Use some idioms. Correct mistakes clearly.` : ''}
- ${level === 'Advanced' ? `Primarily ${language}. Use natural idioms and cultural context. Challenge the student.` : ''}
- Mark corrections: ✓ Better: [correction]
- Keep responses 3-6 sentences unless explaining grammar
- Be warm, fun, and motivating!`
}

// ── Key rotation ─────────────────────────────────────────────────────────────

function getKeys(service: string): string[] {
  const keys: string[] = []
  const plain = process.env[`${service}_API_KEY`]
  if (plain) keys.push(plain)
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`${service}_API_KEY_${i}`]
    if (k) keys.push(k)
    else break
  }
  return [...new Set(keys)]
}

// ── Streaming via Groq (primary) ─────────────────────────────────────────────

async function streamGroq(
  apiKey: string,
  model: string,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<ReadableStream<Uint8Array> | null> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: true,
    }),
  })
  if (!res.ok || !res.body) return null
  return res.body
}

// ── Streaming via Gemini ──────────────────────────────────────────────────────

async function streamGemini(
  apiKey: string,
  model: string,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<ReadableStream<Uint8Array> | null> {
  // Convert messages to Gemini format
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: geminiMessages,
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    },
  )
  if (!res.ok || !res.body) return null
  return res.body
}

// ── SSE passthrough transformer ───────────────────────────────────────────────
// Both Groq (OpenAI-compat) and Gemini emit SSE — we normalise to our own
// simpler format: `data: <token>\n\n` so the frontend just reads chunks.

function normaliseGroqStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buf = ''

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') { controller.enqueue(encoder.encode('data: [DONE]\n\n')); continue }
            try {
              const json = JSON.parse(data)
              const token: string = json.choices?.[0]?.delta?.content ?? ''
              if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`))
            } catch { /* skip malformed */ }
          }
        }
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })
}

function normaliseGeminiStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buf = ''

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            try {
              const json = JSON.parse(data)
              const token: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
              if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`))
            } catch { /* skip */ }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { message, language, native, level, mode, history, interviewProfile } = await req.json()

  const system = buildSystem(language, native, level, mode, interviewProfile ?? null)
  const messages = [
    ...history.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]
  const maxTokens = mode === 'interview' ? 1000 : 800

  // 1. Try Groq streaming (fastest — llama 70b is free)
  const groqKeys = getKeys('GROQ')
  for (const key of groqKeys) {
    for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
      try {
        const upstream = await streamGroq(key, model, system, messages, maxTokens)
        if (upstream) {
          return new Response(normaliseGroqStream(upstream), {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'X-Provider': `groq/${model}`,
            },
          })
        }
      } catch { /* try next */ }
    }
  }

  // 2. Fallback to Gemini streaming
  const geminiKeys = getKeys('GEMINI')
  for (const key of geminiKeys) {
    for (const model of ['gemini-2.0-flash', 'gemini-2.0-flash-lite']) {
      try {
        const upstream = await streamGemini(key, model, system, messages, maxTokens)
        if (upstream) {
          return new Response(normaliseGeminiStream(upstream), {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'X-Provider': `gemini/${model}`,
            },
          })
        }
      } catch { /* try next */ }
    }
  }

  // 3. Hard fallback — non-streaming (Anthropic/OpenAI via existing callAI)
  const { callAI } = await import('@/lib/ai')
  const { text } = await callAI(system, messages, maxTokens, 'balanced')
  // Emit as a single SSE chunk so the frontend doesn't need a special path
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(text)}\n\n`))
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Provider': 'fallback' },
  })
}
