import express from "express";
import { summarizeConversation, streamAssistantChat } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/summarize", summarizeConversation);
router.post("/assistant/stream", streamAssistantChat);

export default router;
