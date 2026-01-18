import { Message } from "../model/message.model.js";
import { ChatRoom } from '../model/chatRoom.model.js';
import cloudinary from '../utils/cloudinary.js';
import getDataUri from '../utils/dataUri.js';
import { io } from "../index.js";
// saving a message in the database 

export const sendMessage = async (req, res) => {
  const { content, chatRoomId } = req.body;
  const senderId = req.id.userId;

  //  console.log('printing : ',content,chatRoomId);

  let attachments = [];

  //  console.log(req.files);

  if (req.files && req.files.length > 0) {
    try {
      const uploadPromises = req.files.map(file => {
        const uriData = getDataUri(file);

        return cloudinary.uploader.upload(uriData.content, {
          folder: 'vOx-Vista',
          resource_type: 'auto',   // Automatically detect the file type (image, pdf, etc.)
          type: 'upload',
          use_filename: true       // Ensure it’s publicly accessible
        });
      });

      const cloudResponses = await Promise.all(uploadPromises);

      // Collect the URLs to send back in the response
      attachments = cloudResponses.map((response, index) => ({
        url: response.secure_url,   // Direct URL for the resource
        public_id: response.public_id,
        mimeType: req.files[index].mimetype
      }));



      // console.log('Attachments:', attachments);
    } catch (err) {
      console.log('File upload error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload files to Cloudinary',
        error: err,
      });
    }
  }

  try {
    const message = await Message.create({
      content,
      sender: senderId,
      chatRoom: chatRoomId,
      attachments,
      deliveredTo: [],
      readBy: [],
    });

    let chatRoom = await ChatRoom.findById(chatRoomId).populate("members");

    const isFirstMessage = !chatRoom.hasMessage && !chatRoom.isGroupChat;

    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      $set: {
        hasMessage: true,
        lastMessage: message._id,
        deletedFor: []
      }
    });

    if (isFirstMessage) {
      const receiver = chatRoom.members.find(
        m => m._id.toString() !== senderId.toString()
      );

      chatRoom = {
        ...chatRoom.toObject(),
        receiver,
        lastMessage: message,
        unreadMsgs: 0
      }
      io.to(receiver._id.toString()).emit("newChatRoom", {
        chatRoom
      });
    }

    //  console.log('message: ' , message);
    const populatedMessage = (await message.populate(['sender', 'chatRoom']));

    res.status(200).json({ success: true, message: populatedMessage });
  } catch (err) {
    console.log('Message creation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: err,
    });
  }
};




// getting all the messages of a chatRoom 

export const getMessagesByChatRoom = async (req, res) => {
  const { chatRoomId } = req.params;

  try {
    const messages = await Message.find({ chatRoom: chatRoomId }).populate('sender');
    return res.status(200).json({
      success: true,
      messages
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      err
    });
  }
}


// // updating message status to delivered 

export const updateMsgToDelivered = async (req, res) => {
  const messageId = req.params.msgId;
  try {
    const message = await Message.findByIdAndUpdate(messageId, { status: 'delivered' }, { new: true });
    return res.status(200).json({
      success: true,
      message
    });
  } catch (err) {
    console.log(err);
  }
}


// updating all messages from a single chatroom of a user to read 

export const updateMsgsToRead = async (req, res) => {
  const senderId = req.params.senderId;
  console.log('hello');
  try {

    const updatedMessages = await Message.updateMany(
      { sender: senderId, status: 'delivered' },
      { $set: { status: 'read' } }
    );

    return res.status(200).json({ success: true, updatedMessages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};



// updating all messages from user to delivered

export const updateAllMsgsToDelivered = async (req, res) => {
  const userId = req.id.userId;
  const chatRoomIds = await getChatRoomsForUser(userId);

  try {
    const updatedMessages = await Message.updateMany(
      {
        sender: { $ne: userId },
        chatRoom: { $in: chatRoomIds },
        status: 'sent'
      },
      {
        $set: { status: 'delivered' }
      }
    );
    res.status(200).json({ success: true, updatedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



// // updating message status to read 

export const updateMsgToRead = async (req, res) => {
  const msgId = req.params.msgId;
  try {
    const message = await Message.findByIdAndUpdate(msgId, { status: 'read' }, { new: true });

    return res.status(200).json({
      success: true,
      message
    });

  } catch (err) {
    console.log(err);
  }
}








// // helping function, getting all the chatrooms in which the user is a member 

const getChatRoomsForUser = async (userId) => {
  const chatRooms = await ChatRoom.find({
    members: userId
  }).select('_id');
  return chatRooms.map(chatRoom => chatRoom._id);
};






export const deleteSelectedMsgs = async (req, res) => {
  const userId = req.id.userId;
  const { selectedMsgs } = req.body;

  if (!Array.isArray(selectedMsgs) || selectedMsgs.length === 0) {
    return res.status(400).json({ success: false, message: "No messages selected" });
  }

  // Validate IDs (convert to ObjectId if needed)
  const mongoose = require('mongoose');
  const ObjectId = mongoose.Types.ObjectId;
  const validIds = selectedMsgs
    .map(id => {
      try { return ObjectId(id); } catch (e) { return null; }
    })
    .filter(Boolean);

  if (validIds.length !== selectedMsgs.length) {
    return res.status(400).json({ success: false, message: "Invalid message IDs provided" });
  }

  try {
    // Ensure all selected messages belong to same chatRoom OR handle grouping
    const messages = await Message.find({ _id: { $in: validIds } }).select('chatRoom attachments deletedFor sender');
    if (messages.length === 0) {
      return res.status(404).json({ success: false, message: "No messages found" });
    }

    // Ensure all messages belong to same chatRoom (choose policy)
    const chatRoomIds = Array.from(new Set(messages.map(m => String(m.chatRoom))));
    if (chatRoomIds.length > 1) {
      // Option A: reject and force caller to delete per-chat
      return res.status(400).json({ success: false, message: "Selected messages belong to multiple chat rooms. Delete per chat." });
      // Option B: continue but group by chatRoom and process each group separately (more work)
    }

    const chatRoomId = chatRoomIds[0];
    const chatRoom = await ChatRoom.findById(chatRoomId).select('members');
    if (!chatRoom) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    // Permission: ensure requesting user is member of the chat room
    if (!chatRoom.members.map(m => String(m)).includes(String(userId))) {
      return res.status(403).json({ success: false, message: "Not authorized to delete messages in this chat" });
    }

    const memberCount = chatRoom.members.length;

    // 1) Add the userId to deletedFor array for the selected messages
    await Message.updateMany(
      { _id: { $in: validIds } },
      { $addToSet: { deletedFor: ObjectId(userId) } }
    );

    // 2) Find messages where deletedFor size >= memberCount (ready to be permanently removed)
    // Use $expr with $gte so it works for groups and respects memberCount
    const msgsToPermanentlyDelete = await Message.find({
      _id: { $in: validIds },
      $expr: { $gte: [ { $size: "$deletedFor" }, memberCount ] }
    }).lean();

    // 3) Delete attachments from Cloudinary and collect IDs actually removed
    const permanentlyDeletedIds = [];
    for (const msg of msgsToPermanentlyDelete) {
      try {
        if (msg.attachments && msg.attachments.length > 0) {
          const deletePromises = msg.attachments
            .map(att => att.public_id ? cloudinary.uploader.destroy(att.public_id) : Promise.resolve(null));
          await Promise.all(deletePromises);
        }
        // 4) Delete the message from DB
        await Message.findByIdAndDelete(msg._id);
        permanentlyDeletedIds.push(String(msg._id));
      } catch (err) {
        // Log and continue with others; do not abort entire operation
        console.error(`Failed to permanently delete message ${msg._id}:`, err);
      }
    }

    // // 5) Emit "messageDeleted" for messages permanently removed so clients can remove them from UI
    // if (permanentlyDeletedIds.length > 0) {
    //   io.to(String(chatRoomId)).emit("messageDeleted", { messageIds: permanentlyDeletedIds, chatRoomId });
    //   // Alternatively use per-recipient emit helper if you want personal room delivery
    // }

    // 6) Return a detailed response
    return res.status(200).json({
      success: true,
      message: "Messages updated for deletion",
      // markedDeletedFor: validIds.map(id => String(id)),
      // permanentlyDeleted: permanentlyDeletedIds
    });
  } catch (err) {
    console.error('Error deleting selected messages:', err);
    return res.status(500).json({ success: false, message: 'Error deleting messages', err: err.message });
  }
};










//deleting a message for everyone in a chatroom

export const deleteMsgForEveryone = async (req, res) => {
  const msgId = req.params.msgId;

  try {
    const msg = await Message.findById(msgId);
    if (!msg) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    const chatRoomId = msg.chatRoom;

    // Delete attachments from Cloudinary
    if (msg.attachments?.length) {
      await Promise.all(
        msg.attachments.map(att =>
          att.public_id ? cloudinary.uploader.destroy(att.public_id) : null
        )
      );
    }

    await Message.findByIdAndDelete(msgId);

    io.to(String(chatRoomId)).emit("messageDeleted", {
      messageId: msgId,
      chatRoomId
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted for everyone"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: err.message
    });
  }
};






//deleting all the messges of a chatroom  for a the user only 
export const clrChatRoomMsgs = async (req, res) => {
  const userId = req.id.userId;
  const { chatRoomId } = req.params;

  try {
    const chatRoom = await ChatRoom.findById(chatRoomId).select("members");
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found"
      });
    }

    const memberCount = chatRoom.members.length;

    // 1️⃣ Mark all messages in this room as deleted for this user
    await Message.updateMany(
      { chatRoom: chatRoomId },
      { $addToSet: { deletedFor: userId } }
    );

    // 2️⃣ Find messages that everyone has deleted
    const msgsToDelete = await Message.find({
      chatRoom: chatRoomId,
      $expr: { $gte: [{ $size: "$deletedFor" }, memberCount] }
    });

    // 3️⃣ Delete attachments
    for (const msg of msgsToDelete) {
      if (msg.attachments?.length) {
        await Promise.all(
          msg.attachments.map(att =>
            att.public_id ? cloudinary.uploader.destroy(att.public_id) : null
          )
        );
      }
    }

    // 4️⃣ Permanently remove those messages
    await Message.deleteMany({
      chatRoom: chatRoomId,
      $expr: { $gte: [{ $size: "$deletedFor" }, memberCount] }
    });

    return res.status(200).json({
      success: true,
      message: "Chat cleared for you"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
