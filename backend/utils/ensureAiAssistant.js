import bcrypt from "bcryptjs";
import { User } from "../model/user.model.js";
import { ChatRoom } from "../model/chatRoom.model.js";
import { Message } from "../model/message.model.js";

const BOT_EMAIL = "ai-assistant@voxvista.bot";
const BOT_USERNAME = "AI Assistant";

export async function getOrCreateAiBot() {
  let bot = await User.findOne({ email: BOT_EMAIL });
  if (!bot) {
    const secret = process.env.AI_BOT_SECRET || "ai-bot-no-login";
    const hash = await bcrypt.hash(secret, 10);
    bot = await User.create({
      userName: BOT_USERNAME,
      email: BOT_EMAIL,
      password: hash,
      isBot: true,
      profile: {
        bio: "Ask me anything — help, ideas, or casual chat.",
      },
    });
  } else if (!bot.isBot) {
    await User.findByIdAndUpdate(bot._id, { isBot: true });
    bot.isBot = true;
  }
  return bot;
}

/**
 * DM room between the user and the AI Assistant bot (always hasMessage so it appears in list).
 */
export async function ensureAiAssistantRoomForUser(userId) {
  const bot = await getOrCreateAiBot();

  let room = await ChatRoom.findOne({
    isGroupChat: false,
    members: { $all: [userId, bot._id], $size: 2 },
  })
    .populate("members")
    .populate("lastMessage");

  if (!room) {
    room = await ChatRoom.create({
      members: [userId, bot._id],
      isGroupChat: false,
      hasMessage: true,
    });
    room = await room.populate("members");
    room = await room.populate("lastMessage");
  }

  const receiver = room.members.find((m) => String(m._id) !== String(userId));
  const unreadMsgs = await Message.countDocuments({
    chatRoom: room._id,
    sender: { $ne: userId },
    readBy: { $ne: userId },
  });

  return {
    chatRoom: {
      ...room.toObject(),
      receiver,
      unreadMsgs,
    },
  };
}
