import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { language, level, topic, native } = await req.json()
  if (!language || !level) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const lessonTopic = topic || `Introduction to ${language} for ${level} learners`

  const system = `You are SpeakFast AI, an expert language educator. Return ONLY valid JSON, no markdown fences.`

  const prompt = `Create a structured language lesson for a ${level} learner studying ${language} (native language: ${native || 'English'}).
Topic: ${lessonTopic}

Return this exact JSON structure:
{
  "title": "Lesson title",
  "objective": "One sentence — what the student will achieve",
  "vocab": [
    { "word": "target language word", "pronunciation": "IPA or phonetic guide", "translation": "English meaning", "example": "example sentence in target language", "exampleTranslation": "English translation of example" }
  ],
  "grammar": {
    "rule": "Name of grammar rule",
    "explanation": "2-3 sentence explanation",
    "pattern": "Pattern template e.g. Subject + Verb + Object",
    "examples": ["example 1 in target language — English", "example 2 in target language — English", "example 3 in target language — English"]
  },
  "phrases": [
    { "phrase": "useful phrase", "translation": "English meaning", "context": "when to use this" }
  ],
  "culturalNote": "One interesting cultural fact relevant to this lesson",
  "practicePrompt": "A conversation starter the student can paste into the chat to practice this lesson"
}

Include 8 vocab words, 4 phrases. Make it educational, accurate and engaging.`

  try {
    const { text } = await callAI(system, [{ role: 'user', content: prompt }], 2000, 'balanced')
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const lesson = JSON.parse(cleaned)
    return NextResponse.json({ lesson })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to generate lesson' }, { status: 500 })
  }
}
