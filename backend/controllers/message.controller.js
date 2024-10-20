import { Message } from "../model/message.model.js";
import { ChatRoom } from '../model/chatRoom.model.js';


// saving a message in the database 

export const sendMessage = async (req, res) => {
  const { content, chatRoomId } = req.body;
  const senderId = req.id.userId;
  let message;
  try {
    message = await Message.create({
      content,
      sender: senderId,
      chatRoom: chatRoomId,
      status: 'sent'
    });
    message = await message.populate('sender');

    await ChatRoom.findByIdAndUpdate(chatRoomId,{ deletedFor: [],lastMessage:message._id}); 


    res.status(200).json({ success: true, message });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      err
    })
  }

}


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


// updating message status to delivered 

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



// updating message status to read 

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



// helping function, getting all the chatrooms in which the user is a member 

const getChatRoomsForUser = async (userId) => {
  const chatRooms = await ChatRoom.find({
    members: userId
  }).select('_id');
  return chatRooms.map(chatRoom => chatRoom._id);
};


export const deleteSelectedMsgs = async (req, res) => {
  const userId = req.id.userId;
  const { selectedMsgs } = req.body;
  console.log(selectedMsgs);
  console.log(userId);
  try {
    await Message.updateMany(
      { _id: { $in: selectedMsgs } },  // Find all messages with the given IDs
      { $addToSet: { deletedFor: userId } } // Add userId to deletedFor array, avoiding duplicates
    );
    await Message.deleteMany({
      _id: { $in: selectedMsgs },
      $expr: {
        $and: [
          { $eq: [{ $size: "$deletedFor" }, 2] },  // Ensures deletedFor has exactly 2 elements
          { $in: [userId, "$deletedFor"] }         // Ensures userId is in the deletedFor array
        ]
      }
    });

    return res.status(200).json({
      success: true,
      message: "Messages successfully updated for deletion"
    });
  } catch (err) {
    console.log(err);
  }
}

//deleting a message for everyone in a chatroom

export const deleteMsgForEveryone = async (req, res) => {
  const msgId = req.params.msgId;
  try {
    const deletedMessage = await Message.findByIdAndDelete(msgId, { new: true });

    return res.status(200).json({
      success: true,
      message: "Message has been deleted permanently for everyone"
    });
  } catch (err) {
    console.log(err);
  }
}

//deleting all the messges of a chatroom  for a the user only 

export const clrChatRoomMsgs = async (req, res) => {
  const userId = req.id.userId;
  const { chatRoomId } = req.params;

  try {
    const result = await Message.updateMany({ chatRoom: chatRoomId, deletedFor: { $ne: userId } }, { $addToSet: { deletedFor: userId } });
    await Message.deleteMany({
      chatRoom: chatRoomId,
      $expr: {
        $and: [
          { $eq: [{ $size: "$deletedFor" }, 2] },  // Ensures deletedFor has exactly 2 elements
          { $in: [userId, "$deletedFor"] }         // Ensures userId is in the deletedFor array
        ]
      }
    });

    if (result.modifiedCount > 0) {
      return res.status(200).json({
        message: 'Successfully cleared all messages from the chat',
        success: true
      });
    } else {
      return res.status(204).json({
        message: 'No messages to clear from the chat',
        success: true
      });
    }

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'internal server error',
      success: false
    })
  }
}