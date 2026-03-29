import Anthropic from "@anthropic-ai/sdk";
import { Message } from "../model/message.model.js";
import { ChatRoom } from "../model/chatRoom.model.js";
import { User } from "../model/user.model.js";

function anthropicClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey: key });
}

/** Summarization: Claude 3.5 Haiku — fast, cheap vs larger Claude, strong enough for chat digests; override via ANTHROPIC_MODEL. */
function modelId() {
  return process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
}

export const summarizeConversation = async (req, res) => {
  const userId = req.id.userId;
  const { chatRoomId } = req.body;

  if (!chatRoomId) {
    return res.status(400).json({ success: false, message: "chatRoomId required" });
  }

  try {
    const member = await ChatRoom.exists({ _id: chatRoomId, members: userId });
    if (!member) {
      return res.status(403).json({ success: false, message: "Not a member of this chat" });
    }

    const bot = await User.findOne({ isBot: true }).select("_id").lean();
    if (bot) {
      const room = await ChatRoom.findById(chatRoomId).select("members isGroupChat").lean();
      const onlyBotDm =
        room &&
        !room.isGroupChat &&
        room.members?.length === 2 &&
        room.members.map(String).includes(String(bot._id));
      if (onlyBotDm) {
        return res.status(400).json({
          success: false,
          message: "Summarization is not available for AI Assistant chat",
        });
      }
    }

    const recent = await Message.find({
      chatRoom: chatRoomId,
      deletedFor: { $ne: userId },
      isSystem: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "userName")
      .lean();

    recent.reverse();

    if (recent.length === 0) {
      return res.status(400).json({ success: false, message: "No messages to summarize" });
    }

    const lines = recent.map((m) => {
      const who = m.sender?.userName || "User";
      const text = (m.content || "").trim() || "[attachment]";
      return `${who}: ${text}`;
    });
    const transcript = lines.join("\n");

    const client = anthropicClient();
    const resp = await client.messages.create({
      model: modelId(),
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Summarize the following chat conversation clearly and concisely in English. Use short paragraphs or bullet points where helpful. Focus on main topics, decisions, and open questions.\n\n---\n${transcript}\n---`,
        },
      ],
    });

    const block = resp.content?.find((b) => b.type === "text");
    const summary = block?.type === "text" ? block.text : "";

    if (!summary?.trim()) {
      return res.status(500).json({ success: false, message: "Empty summary from model" });
    }

    return res.status(200).json({ success: true, summary: summary.trim() });
  } catch (err) {
    console.error("summarizeConversation:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Summary failed",
    });
  }
};

export const streamAssistantChat = async (req, res) => {
  const userId = req.id.userId;
  const { messages: clientMessages } = req.body;

  if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
    return res.status(400).json({ success: false, message: "messages array required" });
  }

  const anthropicMsgs = clientMessages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .map((m) => ({
      role: m.role,
      content: m.content.trim(),
    }));

  if (anthropicMsgs.length === 0) {
    return res.status(400).json({ success: false, message: "No valid messages" });
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    const client = anthropicClient();
    const stream = await client.messages.stream({
      model: modelId(),
      max_tokens: 2048,
      system:
        "You are a friendly, helpful AI assistant in a chat app. Be concise unless the user asks for detail. Do not claim access to other chats or private data.",
      messages: anthropicMsgs,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta?.type === "text_delta" &&
        event.delta.text
      ) {
        send({ type: "token", text: event.delta.text });
      }
    }

    send({ type: "done" });
    res.end();
  } catch (err) {
    console.error("streamAssistantChat:", err);
    send({ type: "error", message: err.message || "Stream failed" });
    res.end();
  }
};
