import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface LessonBody {
  targetLanguage: string;
  level: string;
  topic?: string;
}

router.post("/generate", async (req: Request<{}, {}, LessonBody>, res: Response) => {
  const { targetLanguage, level, topic = "everyday conversation" } = req.body;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `Create a structured ${level} ${targetLanguage} lesson about "${topic}".

Include:
1. 5 key vocabulary words with pronunciation guide and example sentence
2. 1 grammar point with explanation and 3 examples
3. A short dialogue (4-6 exchanges) using the vocabulary
4. 3 practice exercises with answers

Format as clean JSON with keys: vocabulary, grammar, dialogue, exercises`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const lesson = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
    res.json({ lesson });
  } catch {
    res.json({ lesson: { raw: text } });
  }
});

export default router;
