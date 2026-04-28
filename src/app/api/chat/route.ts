import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { message, language, native, level, history } = await req.json()

  const system = `You are SpeakFast AI, an expert ${language} tutor. The student's native language is ${native} and their level is ${level}.

Teaching approach:
- Respond primarily in ${language} with ${native} translations in brackets for difficult words
- Gently correct grammar mistakes with a brief explanation
- Introduce 1-2 new vocabulary words per exchange naturally in context
- Beginner: simple sentences, heavy use of ${native} explanations, lots of encouragement
- Intermediate: more complex grammar, some idioms, less translation
- Advanced: fluent conversation, cultural context, nuanced language
- Keep a warm, encouraging, conversational tone
- Format corrections clearly: ✓ Correct form: [corrected version]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system,
    messages: [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ],
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ reply })
}
