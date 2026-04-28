import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChatBody {
  message: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: "beginner" | "intermediate" | "advanced";
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

router.post("/", async (req: Request<{}, {}, ChatBody>, res: Response) => {
  const { message, targetLanguage, nativeLanguage, level, conversationHistory = [] } = req.body;

  const systemPrompt = `You are LinguaAI, an expert ${targetLanguage} language tutor.
The student's native language is ${nativeLanguage} and they are at ${level} level.

Your teaching style:
- Respond in ${targetLanguage} with ${nativeLanguage} translations in brackets
- Gently correct grammar mistakes and explain why
- Introduce 1-2 new vocabulary words per exchange naturally
- For beginners: simple sentences, lots of encouragement
- For intermediate: more complex grammar, idioms
- For advanced: nuanced conversation, cultural context
- Always keep it conversational and encouraging`;

  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: message },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: systemPrompt,
    messages,
  });

  res.json({
    reply: response.content[0].type === "text" ? response.content[0].text : "",
    usage: response.usage,
  });
});

export default router;
