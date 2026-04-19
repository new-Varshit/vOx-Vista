import { Message } from "../model/message.model.js";
import { ChatRoom } from "../model/chatRoom.model.js";
import { User } from "../model/user.model.js";

function geminiApiKey() {
  const key = process.env.GEMINI_API_KEY;
  console.log(key);
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return key;
}

/** Gemini Flash is low-cost and fast for summarization/assistant chat; override via GEMINI_MODEL. */
function modelId() {
   console.log('Model name:', process.env.GEMINI_MODEL);
  return process.env.GEMINI_MODEL || "gemini-1.5-flash";
}

function extractGeminiText(data) {
  const parts =
    data?.candidates?.[0]?.content?.parts?.filter((p) => typeof p?.text === "string") || [];
  return parts.map((p) => p.text).join("").trim();
}

async function callGemini({ systemInstruction, messages }) {
  const key = geminiApiKey();
  const model = modelId();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    key
  )}`;

  const body = {
    contents: messages,
  };

  if (systemInstruction?.trim()) {
    body.systemInstruction = {
      role: "system",
      parts: [{ text: systemInstruction.trim() }],
    };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const providerMessage =
      data?.error?.message || `Gemini request failed with status ${resp.status}`;
    throw new Error(providerMessage);
  }

  return extractGeminiText(data);
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

    const summary = await callGemini({
      messages: [
        {
          role: "user",
          parts: [
            {
              text: `Summarize the following chat conversation clearly and concisely in English. Use short paragraphs or bullet points where helpful. Focus on main topics, decisions, and open questions.\n\n---\n${transcript}\n---`,
            },
          ],
        },
      ],
    });

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

  const geminiMessages = clientMessages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.trim() }],
    }));

  if (geminiMessages.length === 0) {
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
    const fullText = await callGemini({
      systemInstruction:
        "You are a friendly, helpful AI assistant in a chat app. Be concise unless the user asks for detail. Do not claim access to other chats or private data.",
      messages: geminiMessages,
    });

    if (!fullText) {
      send({ type: "error", message: "Empty response from model" });
      res.end();
      return;
    }

    const chunks = fullText.match(/.{1,80}(\s+|$)/g) || [fullText];
    for (const chunk of chunks) {
      send({ type: "token", text: chunk });
    }

    send({ type: "done" });
    res.end();
  } catch (err) {
    console.error("streamAssistantChat:", err);
    send({ type: "error", message: err.message || "Stream failed" });
    res.end();
  }
};
