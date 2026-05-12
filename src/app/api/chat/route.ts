import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

const TECH_LANGS = ['Python', 'JavaScript', 'SQL', 'Prompt Engineering', 'AI Concepts']

// ── Deep level specs — used in both tech and language interviews ──────────────

interface TechLevelSpec {
  depth: string
  topics: Record<string, string>
  questionStyle: string
  scoring: string
  feedbackDepth: string
}

const TECH_INTERVIEW_SPEC: Record<string, TechLevelSpec> = {
  Beginner: {
    depth: 'foundational — no tricks, no edge cases',
    topics: {
      Python: 'variables, print(), input(), if/else, for/while loops, basic functions (def), lists, strings, len()',
      JavaScript: 'var/let/const, console.log, if/else, for loop, functions, arrays, typeof, basic DOM',
      SQL: 'SELECT, WHERE, ORDER BY, LIMIT, COUNT, basic JOIN on 2 tables, primary key concept',
      'Prompt Engineering': 'what a prompt is, role/instruction/context/output format, temperature basics, zero-shot vs few-shot',
      'AI Concepts': 'what ML is, supervised vs unsupervised, training vs inference, what a model is, accuracy/loss basics',
    },
    questionStyle: 'Define X. What does Y do? Write a 5-line function that…',
    scoring: 'Reward correct syntax and basic understanding. −1 for each major error. Score out of 10.',
    feedbackDepth: 'Show the correct line side-by-side with their error. Explain WHY in 1 sentence.',
  },
  Intermediate: {
    depth: 'applied — real scenarios, edge cases matter',
    topics: {
      Python: 'list comprehensions, dict/set ops, exception handling, file I/O, classes & inheritance, decorators, generators, requests lib, pytest basics',
      JavaScript: 'closures, promises, async/await, Array methods (map/filter/reduce), ES6 classes, fetch API, event loop, error handling, basic React state',
      SQL: 'GROUP BY + HAVING, subqueries, CTEs, LEFT/RIGHT/INNER JOIN, window functions (ROW_NUMBER, RANK), indexes, NULL handling, CASE WHEN',
      'Prompt Engineering': 'chain-of-thought, ReAct pattern, system vs user message, context window limits, prompt injection risks, structured output (JSON mode), RAG concept',
      'AI Concepts': 'overfitting/underfitting, train/val/test split, precision/recall/F1, gradient descent intuition, embeddings, transformers at high level, fine-tuning vs prompting',
    },
    questionStyle: "Given this code snippet, what's wrong? Write a function that handles X edge case. Explain the difference between A and B with an example.",
    scoring: 'Partial credit for correct approach with syntax errors. −2 for logical errors. Score out of 10.',
    feedbackDepth: 'Show corrected code block, explain the gotcha, give 1 follow-up tip to deepen understanding.',
  },
  Advanced: {
    depth: 'expert — design trade-offs, performance, real production concerns',
    topics: {
      Python: 'GIL & threading vs multiprocessing, asyncio internals, metaclasses, descriptors, memory profiling, C extensions, type annotations & mypy, concurrency patterns, Django/FastAPI internals',
      JavaScript: 'event loop microtask queue, V8 optimisation hints, WeakMap/WeakRef, Service Workers, WebAssembly integration, React reconciler internals, memory leaks, monorepo tooling, build optimisation',
      SQL: 'query plan analysis (EXPLAIN ANALYZE), index types (B-tree/Hash/GIN/GiST), partitioning strategies, MVCC, deadlocks, materialised views, sharding vs replication trade-offs, full-text search',
      'Prompt Engineering': 'adversarial prompting & defence, constitutional AI, RLHF intuition, prompt compression, multi-agent orchestration, tool-use design, evals & automated testing, cost/latency optimisation',
      'AI Concepts': 'attention mechanism math, LoRA/QLoRA, RLHF pipeline, model distillation, RAG vs fine-tuning trade-offs, hallucination mitigation, inference optimisation (quantisation, KV cache), LLM evaluation frameworks',
    },
    questionStyle: 'Design X for 10M users. What are the trade-offs? Debug this production issue. Critique this architecture. How would you benchmark/optimise this?',
    scoring: 'Expect complete answers with trade-offs mentioned. −3 for missing key concern. Score out of 10.',
    feedbackDepth: 'Critique their architecture decision, mention the production risk they missed, suggest a concrete alternative pattern.',
  },
}

const LANG_INTERVIEW_SPEC: Record<string, Record<string, string>> = {
  Beginner: {
    depth: 'A1–A2 CEFR equivalent — simple, high-frequency vocabulary only',
    topics: 'greetings & self-introduction, numbers & age, family members, daily routine, food & colours, simple present tense, possessives (my/your), basic yes/no questions',
    questionStyle: 'What is your name? How old are you? Describe your family in 2 sentences. What do you eat for breakfast?',
    scoring: 'Full marks for correct meaning even if pronunciation/grammar imperfect. −1 per major grammar error (wrong verb form, wrong word order). Score /10.',
    feedbackDepth: 'Quote their exact sentence, underline the error word, show the corrected sentence. Explain in their native language.',
    expectation: 'Expect 1–3 sentence answers. Do NOT penalise for short answers.',
  },
  Intermediate: {
    depth: 'B1–B2 CEFR equivalent — opinions, narratives, abstract ideas',
    topics: 'past/future/conditional tenses, opinion phrases, comparatives/superlatives, work & education vocabulary, travel, current events (simple), reported speech, phrasal verbs, connectors (however/although/despite)',
    questionStyle: 'Describe a memorable trip. What do you think about [current topic]? Compare living in a city vs village. What would you do if…?',
    scoring: 'Reward fluency and range of vocabulary. −1 per tense error, −1 per misused connector. Score /10.',
    feedbackDepth: 'Highlight their best phrase (reinforce good output), then correct 1–2 errors with full corrected sentence + rule explanation.',
    expectation: 'Expect 4–6 sentence paragraph answers. Penalise very short answers.',
  },
  Advanced: {
    depth: 'C1–C2 CEFR equivalent — near-native fluency, nuance, register',
    topics: 'subjunctive mood, passive constructions, idiomatic expressions, abstract & philosophical topics, professional register, debate & argumentation, complex syntax, cultural references, formal writing style',
    questionStyle: 'Argue for and against X. Analyse this cultural phenomenon. Use an idiomatic expression naturally. Explain a complex concept as if to a child in the target language.',
    scoring: 'High bar — expect accurate complex grammar, varied vocabulary, natural discourse markers. −2 per idiom misuse, −1 per register mismatch. Score /10.',
    feedbackDepth: 'Evaluate register (formal/informal appropriateness), idiom naturalness, discourse cohesion. Offer a C2-level model sentence.',
    expectation: 'Expect 6–10 sentence answers with argumentation structure. Penalise simple vocabulary or repetition.',
  },
}

interface InterviewProfile {
  jobTitle?: string
  jobDescription?: string
  targetCompany?: string
  yearsExp?: string
  skills?: string
  interviewType?: string
}

function buildInterviewSystem(language: string, native: string, level: string, profile: InterviewProfile | null): string {
  const isTech = TECH_LANGS.includes(language)

  // Build profile context strings
  const roleCtx = profile?.jobTitle ? `The candidate is applying for a **${profile.jobTitle}** role` : 'The candidate has not specified a target role'
  const companyCtx = profile?.targetCompany ? ` at **${profile.targetCompany}**` : ''
  const expCtx = profile?.yearsExp ? ` with **${profile.yearsExp} years** of experience` : ''
  const skillsCtx = profile?.skills ? `\nCANDIDATE SKILLS CLAIMED: ${profile.skills} — probe these directly, challenge depth.` : ''
  const jdCtx = profile?.jobDescription
    ? `\nJOB DESCRIPTION (extract real requirements from this and ask about them directly):\n${profile.jobDescription}`
    : ''
  const interviewTypeCtx = profile?.interviewType ?? 'technical'

  const profileBlock = `
CANDIDATE PROFILE:
${roleCtx}${companyCtx}${expCtx}.${skillsCtx}${jdCtx}
INTERVIEW TYPE: ${interviewTypeCtx}

Calibrate every question to this profile. If they listed React in skills, probe React. If the JD mentions microservices, ask about microservices. If they claim 5 years, hold them to senior-level precision.`

  if (isTech) {
    const spec = TECH_INTERVIEW_SPEC[level] ?? TECH_INTERVIEW_SPEC.Intermediate
    const topicList = spec.topics[language] ?? 'core concepts'

    // Behavioural/mixed override for question style
    const effectiveStyle = interviewTypeCtx === 'behavioural'
      ? 'Tell me about a time you… What would you do if… Describe a challenge where… How do you handle…'
      : interviewTypeCtx === 'system-design'
      ? 'Design X for Y scale. How would you architect…? What are the trade-offs between A and B? Walk me through your data model for…'
      : interviewTypeCtx === 'mixed'
      ? `Mix of: ${spec.questionStyle} AND behavioural (STAR-format) questions.`
      : spec.questionStyle

    return `You are a senior ${language} technical interviewer${profile?.targetCompany ? ` at ${profile.targetCompany}` : ' at a top tech company'}. You are conducting a REAL ${level}-level ${language} ${interviewTypeCtx} interview.
${profileBlock}

INTERVIEW DEPTH: ${spec.depth}
TOPIC SCOPE: ${topicList}
QUESTION STYLE: ${effectiveStyle}

STRICT RULES:
1. Ask exactly ONE question per turn. Never multiple.
2. Do NOT give hints before the candidate answers.
3. Do NOT praise before seeing the answer.
4. After every answer, output this exact block:

━━━ FEEDBACK ━━━
✅ Correct: [quote what they got right — be specific]
❌ Error: [quote the exact mistake] → Fix: [corrected code/answer]
💡 Model answer: [your ${level}-appropriate ideal answer in full]
📊 Score: [X]/10 — [one-line justification]
━━━━━━━━━━━━━━━

Scoring guide: ${spec.scoring}
Feedback depth: ${spec.feedbackDepth}

5. After 5 questions, output FINAL REPORT:
━━━ INTERVIEW COMPLETE ━━━
📊 Overall: [X]/10
🏆 Strongest: [specific skill they demonstrated]
🎯 Gap: [specific weakness + 1 code example showing the right way]
📚 Next step: [1 concrete resource or practice drill]
━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: Format all code in backtick blocks. Stay in interviewer mode — never break character.`
  }

  const spec = LANG_INTERVIEW_SPEC[level] ?? LANG_INTERVIEW_SPEC.Intermediate

  return `You are a certified ${language} language examiner (${level === 'Beginner' ? 'A1–A2' : level === 'Intermediate' ? 'B1–B2' : 'C1–C2'} CEFR). The candidate's native language is ${native}.
${profileBlock}

EXAM DEPTH: ${spec.depth}
TOPIC SCOPE: ${spec.topics}
QUESTION STYLE: ${spec.questionStyle}
EXPECTATION: ${spec.expectation}

STRICT RULES:
1. Ask exactly ONE question per turn. Never multiple.
2. Do NOT coach before the candidate answers.
3. Respond in English for feedback, use ${language} for questions.
4. After every answer, output this exact block:

━━━ EXAMINER FEEDBACK ━━━
✅ Correct: [quote their exact correct phrase/construction — reinforce it]
❌ Error: [quote exact mistake] → Correction: [corrected sentence in ${language}]
💡 Native-level answer: [model ${level}-appropriate sentence in ${language}]
📊 Score: [X]/10 — [one-line justification]
━━━━━━━━━━━━━━━━━━━━━━━━

Scoring guide: ${spec.scoring}
Feedback depth: ${spec.feedbackDepth}

5. After 5 questions, output FINAL REPORT:
━━━ EXAM COMPLETE ━━━
📊 Overall: [X]/10 (${level === 'Beginner' ? 'A1–A2' : level === 'Intermediate' ? 'B1–B2' : 'C1–C2'} CEFR)
🏆 Strongest: [specific skill]
🎯 Gap: [specific weakness + corrected example]
📚 Next step: [1 targeted exercise — e.g. "Practice imperfect tense with 10-minute daily journaling"]
━━━━━━━━━━━━━━━━

IMPORTANT: Use proper unicode for ${language} script. Maintain examiner persona throughout. Never skip the feedback block — this is the core value.`
}

export async function POST(req: NextRequest) {
  const { message, language, native, level, mode, history, interviewProfile } = await req.json()

  const isTech = TECH_LANGS.includes(language)

  let system: string

  if (mode === 'interview') {
    system = buildInterviewSystem(language, native, level, interviewProfile ?? null)
  } else if (isTech) {
    system = `You are SpeakFast AI, an expert ${language} tutor. The student's background is ${level} level and their native language is ${native}.

Teaching approach for ${language}:
- Explain concepts clearly with real-world examples
- Show runnable code snippets for programming languages
- Break complex ideas into digestible steps
- Give practical exercises after each concept
- Encourage and celebrate progress
- Adapt complexity to ${level} level

Format: Use clear sections, code blocks with backticks for code, emoji sparingly for warmth.`
  } else {
    const modeInstructions: Record<string, string> = {
      conversation: `Have a natural, flowing conversation in ${language}. Gently correct mistakes with: ✓ Better: [correction]. Introduce vocabulary naturally.`,
      vocabulary: `Focus on vocabulary building. Each response: introduce 3-5 new words with pronunciation hint, meaning in ${native}, and an example sentence. Quiz the student on previous words.`,
      grammar: `Focus on one grammar concept at a time. Explain it in ${native}, give 3 examples in ${language}, then ask the student to make their own sentence. Correct and explain mistakes.`,
      quiz: `Run a quiz! Ask questions in ${language} appropriate for ${level} level. After each answer: ✓ Correct! or ✗ The answer is: [correct answer] [explanation]. Keep score mentally and report it.`,
      translate: `Practice translation. Give a sentence in ${native} and ask the student to translate to ${language}. Then show the ideal translation and explain any differences.`,
      story: `Tell an interactive story in ${language} at ${level} level. After each segment, ask the student to choose what happens next or describe something in ${language}. Make it fun and educational.`,
    }

    system = `You are SpeakFast AI, a warm and encouraging ${language} tutor. The student's native language is ${native} and their level is ${level}.

${modeInstructions[mode] || modeInstructions.conversation}

General rules:
- ${level === 'Beginner' ? `Mostly use simple ${language} with ${native} translations in [brackets]. Be very encouraging. Celebrate every attempt.` : ''}
- ${level === 'Intermediate' ? `Balance ${language} and ${native} explanations. Use some idioms. Correct mistakes clearly.` : ''}
- ${level === 'Advanced' ? `Primarily ${language}. Use natural idioms and cultural context. Challenge the student.` : ''}
- Mark corrections clearly: ✓ Better: [correction]
- Keep responses focused and not too long (3-6 sentences max unless explaining grammar)
- Be warm, fun, and motivating — learning should feel good!

IMPORTANT: If the student writes in Tamil, Hindi, Arabic or any non-Latin script, respond with proper unicode characters for that language.`
  }

  const maxTokens = mode === 'interview' ? 1000 : 800

  const { text: reply } = await callAI(
    system,
    [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ],
    maxTokens,
    'balanced',
  )

  return NextResponse.json({ reply })
}
