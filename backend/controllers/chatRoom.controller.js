import { ChatRoom } from "../model/chatRoom.model.js";
import { Message } from "../model/message.model.js";

export const createOrGetChatRoom = async (req, res) => {
    const { userId } = req.id;
    const { recipientID } = req.body;
    try {
        let chatRoom = await ChatRoom.findOne({
            isGroupChat: false,
            members: { $all: [userId, recipientID] }
        });

        if (!chatRoom) {
            chatRoom = await ChatRoom.create({
                members: [userId, recipientID],
                isGroupChat: false
            });
        }

        return res.status(200).json({
            success: true,
            chatRoom
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'failed to create or retrieve chat room ',
            err
        })
    }
}

export const getAllChatRooms = async (req, res) => {
    const userId = req.id.userId;
    console.log('the user id is : ', userId);
    try {
        const chats = await ChatRoom.find({
            members: { $in: [userId] }
        }).populate('members');

        const chatRoomsPromises = chats.map(async chat => {
            const receiverProfile = chat.members.find(member => String(member._id) !== String(userId));
            const unreadMsgs = await getNumberOfUnreadMsgs(chat._id, receiverProfile._id);
            return {
                ...chat.toObject(),
                receiver: receiverProfile,
                unreadMsgs
            }
        });

        const chatRooms = await Promise.all(chatRoomsPromises);

        return res.status(200).json({
            success: true,
            chatRooms
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching chat rooms'
        });
    }
}

const getNumberOfUnreadMsgs = async (chatRoomId, receiverId) => {
    try {
        const unreadMsgsCount = await Message.countDocuments({
            chatRoom: chatRoomId,
            sender: receiverId,
            status: { $ne: 'read' }
        });
        console.log('Unread messages:', unreadMsgsCount);
        return unreadMsgsCount;
    } catch (err) {
        console.error('Error counting unread messages:', err);
        throw err; 
    }
}