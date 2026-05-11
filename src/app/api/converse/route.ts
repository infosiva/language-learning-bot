import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { messages, language, level, tutorName } = await req.json()

  const system = `You are ${tutorName ?? 'Luna'}, a warm and encouraging ${language} language tutor.
The student is at ${level} level. Respond ONLY in ${language}, then add corrections.

Format your response as JSON:
{
  "reply": "<your response in ${language}>",
  "replyTranslation": "<English translation of your reply>",
  "corrections": [
    { "original": "<what student wrote>", "fixed": "<corrected version>", "explanation": "<brief why>" }
  ]
}

If the student wrote correctly, return corrections as an empty array [].
Keep replies short (2-3 sentences max). Be warm and encouraging.`

  try {
    const { text } = await callAI(system, messages, 600, 'balanced')
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
