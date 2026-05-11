import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { language, level, seed } = await req.json()
  const system = `You are a language quiz generator. Return ONLY valid JSON.`
  const prompt = `Create a 3-question daily challenge for a ${level} ${language} learner.
Seed for consistency: ${seed}

Return:
{
  "title": "Today's Challenge",
  "questions": [
    {
      "question": "What does X mean?",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Brief explanation"
    }
  ]
}`
  try {
    const { text } = await callAI(system, [{ role: 'user', content: prompt }], 800, 'fast')
    const data = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
