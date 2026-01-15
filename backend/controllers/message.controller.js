import { Message } from "../model/message.model.js";
import { ChatRoom } from '../model/chatRoom.model.js';
import cloudinary from '../utils/cloudinary.js';
import getDataUri from '../utils/dataUri.js';
import { io } from "../index.js";
// saving a message in the database 

export const sendMessage = async (req, res) => {
  const { content, chatRoomId } = req.body;
  const senderId = req.id.userId;

<<<<<<< HEAD
  //  console.log('printing : ',content,chatRoomId);
=======
     console.log('printing : ',content,chatRoomId);
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556

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
<<<<<<< HEAD

    if(isFirstMessage){
      const receiver = chatRoom.members.find(
        m => m._id.toString() !== senderId.toString()
      );
    
      chatRoom = {
        ...chatRoom.toObject(),
        receiver,
        lastMessage:message,
        unreadMsgs:0
      }
      io.to(receiver._id.toString()).emit("newChatRoom", {
        chatRoom
      });
    }
=======
       console.log('message: ' , message);
    const populatedMessage = (await message.populate(['sender','chatRoom']));
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556

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

  try {
    // 1. Add the userId to the deletedFor array
    await Message.updateMany(
      { _id: { $in: selectedMsgs } },  // Find all messages with the given IDs
      { $addToSet: { deletedFor: userId } } // Add userId to deletedFor array, avoiding duplicates
    );

    // 2. Find messages where both users have marked it for deletion
    const msgs = await Message.find({
      _id: { $in: selectedMsgs },
      $expr: {
        $and: [
          { $eq: [{ $size: "$deletedFor" }, 2] },  // Ensures deletedFor has exactly 2 elements
          { $in: [userId, "$deletedFor"] }         // Ensures userId is in the deletedFor array
        ]
      }
    });

    // 3. Delete attachments from Cloudinary
    for (const msg of msgs) {
      if (msg.attachments && msg.attachments.length > 0) {
        const deletePromises = msg.attachments.map(attachment => {
          return cloudinary.uploader.destroy(attachment.public_id);
        });
        // Await the completion of all deletion promises
        await Promise.all(deletePromises);
      }
    }

    // 4. Delete messages from the database after Cloudinary cleanup
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
    return res.status(500).json({
      success: false,
      message: 'Error deleting messages',
      err
    });
  }
};










//deleting a message for everyone in a chatroom

export const deleteMsgForEveryone = async (req, res) => {
  const msgId = req.params.msgId;
  try {
    // Find the message by its ID
    const msg = await Message.findById(msgId);
    const chatRoomId = msg.chatRoom;
    if (!msg) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Delete attachments from Cloudinary if any
    if (msg.attachments && msg.attachments.length > 0) {
      const deletePromises = msg.attachments.map(attachment => {
        return cloudinary.uploader.destroy(attachment.public_id);
      });

      // Use Promise.all to delete all attachments concurrently
      const results = await Promise.all(deletePromises);
      // console.log('Deletion results:', results); // This will log the results of the deletion
    }

    // Delete the message from the database
    await Message.findByIdAndDelete(msgId);

    io.to(chatRoomId).emit("messageDeleted", {
      messageId: msgId,
      chatRoomId
    });

    return res.status(200).json({
      success: true,
      message: "Message has been deleted permanently for everyone"
    });
  } catch (err) {
    console.error('Error deleting message or attachments:', err);
    return res.status(500).json({
      success: false,
      message: "Error deleting message or attachments",
      error: err.message
    });
  }
};





//deleting all the messges of a chatroom  for a the user only 

export const clrChatRoomMsgs = async (req, res) => {
  const userId = req.id.userId;
  const { chatRoomId } = req.params;

  try {
    const result = await Message.updateMany({ chatRoom: chatRoomId, deletedFor: { $ne: userId } }, { $addToSet: { deletedFor: userId } });

    //  Find messages where both users have marked it for deletion
    const msgs = await Message.find({
      _id: { $in: selectedMsgs },
      $expr: {
        $and: [
          { $eq: [{ $size: "$deletedFor" }, 2] },  // Ensures deletedFor has exactly 2 elements
          { $in: [userId, "$deletedFor"] }         // Ensures userId is in the deletedFor array
        ]
      }
    });

    //  Delete attachments from Cloudinary
    for (const msg of msgs) {
      if (msg.attachments && msg.attachments.length > 0) {
        const deletePromises = msg.attachments.map(attachment => {
          return cloudinary.uploader.destroy(attachment.public_id);
        });
        // Await the completion of all deletion promises
        await Promise.all(deletePromises);
      }
    }


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

