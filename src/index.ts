import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import chatRouter from "./routes/chat";
import lessonRouter from "./routes/lessons";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/lessons", lessonRouter);

app.get("/health", (_, res) => res.json({ status: "ok", service: "LinguaAI" }));

app.listen(PORT, () => console.log(`LinguaAI running on :${PORT}`));
