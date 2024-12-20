import { ChatRoom } from "../model/chatRoom.model.js";
import { Message } from "../model/message.model.js";
import cloudinary from '../utils/cloudinary.js';
import getDataUri from '../utils/dataUri.js';

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

        chatRoom = await chatRoom.populate('lastMessage');
        // console.log('your chat room :', chatRoom);
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

export const createGroupChat = async (req, res) => {
    console.log('hello creating group chat')
    const { name } = req.body;
      const members = JSON.parse(req.body.members);
    const groupIcon = req.file;
    const userId = req.id?.userId;
    console.log(members,name);
    console.log(req.file);

    if (!members || !name || !groupIcon) {
        return res.status(400).json({
            success: false,
            message: 'Invalid input data'
        });
    }
   

    const uriData = getDataUri(req.file); // Adjusted to handle single file input

    let cloudResponse;
    try {
        cloudResponse = await cloudinary.uploader.upload(uriData.content, {
            folder: 'vOx-Vista',
        });
    } catch (uploadError) {
        return res.status(500).json({
            success: false,
            message: 'Failed to upload group icon',
            error: uploadError
        });
    }

    members.push(userId);
         let groupChat;
    try {
         groupChat = await ChatRoom.create({
            name: name,
            isGroupChat: true,
            admin: userId,
            members: members,
            groupIcon: cloudResponse.secure_url
        });

          groupChat = await groupChat.populate('members');

        console.log(groupChat);

        return res.status(200).json({
            success: true,
            groupChat
        });
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).json({
            success: false,
            message: 'Failed to create group chat room',
            error: err
        });
    }
};



export const getAllChatRooms = async (req, res) => {
    const userId = req.id.userId;
    // console.log('the user id is : ', userId);
    try {
        const chats = await ChatRoom.find({
            members: { $in: [userId] }
        }).populate('members').populate('lastMessage');



        const chatRoomsPromises = chats.map(async chat => {
                       let lastMessage;
            if(!chat.isGroupChat){
                const receiverProfile = chat.members.find(member => String(member._id) !== String(userId));

                const unreadMsgs = await getNumberOfUnreadMsgs(chat._id, receiverProfile._id);
                lastMessage = await Message.findOne({
                    chatRoom: chat._id,
                    deletedFor: { $ne: userId }
                }).sort({ createdAt: -1 });
                return {
                    ...chat.toObject(),
                    receiver: receiverProfile,
                    unreadMsgs,
                    lastMessage
                }
            }else{
                 lastMessage = await Message.findOne({
                    chatRoom: chat._id,
                    deletedFor: { $ne: userId }
                }).sort({ createdAt: -1 });

                return {
                    ...chat.toObject(),
                    lastMessage
                }
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
        // console.log('Unread messages:', unreadMsgsCount);
        return unreadMsgsCount;
    } catch (err) {
        console.error('Error counting unread messages:', err);
        throw err;
    }
}

export const dltChatRoom = async (req, res) => {
    const userId = req.id.userId;
    const { chatRoomId } = req.params;
    try {
        await Message.updateMany({ chatRoom: chatRoomId, deletedFor: { $ne: userId } }, {
            $addToSet: { deletedFor: userId }
        });

        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (chatRoom.deletedFor.length > 0 && !chatRoom.deletedFor.includes(userId)) {
            await Message.deleteMany({ chatRoom: chatRoomId });
            await ChatRoom.findByIdAndDelete(chatRoomId);
        } else {
            await ChatRoom.findByIdAndUpdate(chatRoomId, { $addToSet: { deletedFor: userId } })
        }

        return res.status(200).json({
            success: true,
            message: 'successfully deleted chat'
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
}

export const searchActiveChatRoom = async (req, res) => {
    const userId = req.id.userId;
    const { searchChatRoom } = req.query;
    // if(!searchChatRoom){
    //     getAllChatRooms();
    // }
    try {
        let chatRooms = await ChatRoom.find({
            members: { $in: [userId] },
        }).populate('members').populate('lastMessage');

        console.log('before promises', chatRooms)

        const chatRoomsPromises = chatRooms.map(async chat => {

            const receiverProfile = chat.members.find(member => String(member._id) !== String(userId) && member.userName?.toLowerCase().startsWith(searchChatRoom.toLowerCase()));
            if (!receiverProfile) {
                return null;
            }
            const unreadMsgs = await getNumberOfUnreadMsgs(chat._id, receiverProfile?._id);
            let lastMessage = await Message.findOne({
                chatRoom: chat._id,
                deletedFor: { $ne: userId }
            }).sort({ createdAt: -1 });
            return {
                ...chat.toObject(),
                receiver: receiverProfile,
                unreadMsgs,
                lastMessage
            }
        });


        chatRooms = (await Promise.all(chatRoomsPromises)).filter(chatRoom => chatRoom !== null);

        console.log('after promises', chatRooms);

        return res.status(200).json({
            success: true,
            chatRooms,
            message: 'successfully fetched searched active chatRooms'
        })
    } catch (err) {
        console.log(err);
    }
}