import { ChatRoom } from "../model/chatRoom.model.js";
import { Message } from "../model/message.model.js";
import cloudinary from '../utils/cloudinary.js';
import getDataUri from '../utils/dataUri.js';
import { io } from "../index.js";

const SYSTEM_USER_ID = "000000000000000000000000"; // any valid ObjectId-like string


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

    const { name } = req.body;
    const members = JSON.parse(req.body.members);
    const groupIcon = req.file;
    const userId = req.id?.userId;


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
            groupIcon: cloudResponse.secure_url,
            hasMessage: true
        });

        groupChat = await groupChat.populate('members');

        groupChat.members.forEach(mem => {
            io.to(mem._id.toString()).emit('newGrpChatCreated', {
                groupChatRoom: groupChat
            })
        })



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
            members: { $in: [userId] },
            hasMessage: true,
            deletedFor: { $ne: userId }
        })
            .populate('members')
            .populate('lastMessage');

        const chatRoomsPromises = chats.map(async chat => {
            let lastMessage;
            const unreadMsgs = await getNumberOfUnreadMsgs(chat._id, userId);

            if (!chat.isGroupChat) {
                const receiverProfile = chat.members.find(member => String(member._id) !== String(userId));
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
            } else {
                lastMessage = await Message.findOne({
                    chatRoom: chat._id,
                    deletedFor: { $ne: userId }
                }).sort({ createdAt: -1 });

                return {
                    ...chat.toObject(),
                    lastMessage,
                    unreadMsgs
                }
            }

        });

        const chatRooms = await Promise.all(chatRoomsPromises);
        chatRooms.sort(
            (a, b) =>
                new Date(b.lastMessage?.createdAt || 0) -
                new Date(a.lastMessage?.createdAt || 0)
        );

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




const getNumberOfUnreadMsgs = async (chatRoomId, userId) => {

    try {
        const unreadMsgsCount = await Message.countDocuments({
            chatRoom: chatRoomId,
            sender: { $ne: userId },
            readBy: { $ne: userId }
        });
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
    try {
        let chatRooms = await ChatRoom.find({
            members: { $in: [userId] }, hasMessage: true, deletedFor: { $ne: userId }
        }).populate('members').populate('lastMessage');


        const chatRoomsPromises = chatRooms.map(async chat => {

            const receiverProfile = chat.members.find(member => String(member._id) !== String(userId) && member.userName?.toLowerCase().startsWith(searchChatRoom.toLowerCase()));
            if (!receiverProfile) {
                return null;
            }
            const unreadMsgs = await getNumberOfUnreadMsgs(chat._id, userId);
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


        return res.status(200).json({
            success: true,
            chatRooms,
            message: 'successfully fetched searched active chatRooms'
        })
    } catch (err) {
        console.log(err);
    }
}




// GroupChat controllers 
export const addMember = async (req, res) => {
    const { chatRoomId, members } = req.body;

    try {
        await ChatRoom.findByIdAndUpdate(chatRoomId, {
            $addToSet: { members: { $each: members } }
        });

        const updatedGroup = await ChatRoom.findById(chatRoomId).populate("members").populate("lastMessage");

        const adminUser = updatedGroup.members.find(
            mem => mem._id.toString() === updatedGroup.admin.toString()
        );
        const adderName = adminUser?.userName || "Someone";

        // 1️⃣ Notify ONLY newly added members
        members.forEach(memId => {
            io.to(memId.toString()).emit("addedToGrp", {
                newGrpChat: updatedGroup
            });
        });


        // 2️⃣ Notify existing members about update
        updatedGroup.members.forEach(mem => {
            if (!members.includes(mem._id.toString())) {

                io.to(mem._id.toString()).emit("grpMembersUpdated", {
                    chatRoomId,
                    members: updatedGroup.members
                });
            }
        });


        // 3️⃣ Create and broadcast system messages
        for (const memId of members) {
            const newUser = updatedGroup.members.find(
                m => m._id.toString() === memId.toString()
            );

            let systemMsg = await Message.create({
                chatRoom: chatRoomId,
                sender: SYSTEM_USER_ID,
                content: `${adderName} added ${newUser.userName} to the group`,
                isSystem: true
            });

            systemMsg = await systemMsg.populate([
                { path: 'sender' },
                { path: 'chatRoom' }
            ]);


            for (const upMemId of updatedGroup.members) {
                io.to(upMemId._id.toString()).emit("receiveMessage", systemMsg);

                io.to(upMemId._id.toString()).emit("incrementUnread", { chatRoomId, message: systemMsg });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Member added successfully"
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false });
    }
};







export const editGroupInfo = async (req, res) => {
    const { name, description, chatRoomId } = req.body;

    try {
        const oldGrpInfo = await ChatRoom.findById(chatRoomId);
        if (!oldGrpInfo) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        let updateData = { name, description };
        let systemMessages = [];

        if (name && name !== oldGrpInfo.name) {
            systemMessages.push(`Group name was changed to "${name}"`);
        }

        if (description && description !== oldGrpInfo.description) {
            systemMessages.push(`Group description was updated`);
        }

        if (req.file) {
            const uriData = getDataUri(req.file);
            const cloudResponse = await cloudinary.uploader.upload(uriData.content, {
                folder: "vOx-Vista",
            });

            updateData.groupIcon = cloudResponse.secure_url;
            systemMessages.push(`Group icon was changed`);
        }

        await ChatRoom.findByIdAndUpdate(chatRoomId, updateData);

        const updatedGroup = await ChatRoom.findById(chatRoomId).populate('members').populate('lastMessage');

        updatedGroup.members.forEach(mem => {
            io.to(mem._id.toString()).emit('grpInfoEdited', {
                updatedGroup
            });
        })

        for (let text of systemMessages) {
            let sysMsg = await Message.create({
                chatRoom: chatRoomId,
                sender: SYSTEM_USER_ID,
                isSystem: true,
                content: text,
            });

            sysMsg = await sysMsg.populate([
                { path: 'sender' },
                { path: 'chatRoom' }
            ]);

            updatedGroup.members.forEach(mem => {
                io.to(mem._id.toString()).emit('receiveMessage', sysMsg);
                io.to(mem._id.toString()).emit('incrementUnread', {
                    message: sysMsg,
                    chatRoomId
                })
            })


        }

        return res.status(200).json({
            success: true,
            message: "Group Info updated successfully"
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false });
    }
}


export const removeMember = async (req, res) => {
    const { member, chatRoomId } = req.body;

    try {
        // Remove the member from group
        await ChatRoom.findByIdAndUpdate(chatRoomId, {
            $pull: { members: member._id }
        });

        // Fetch updated group with members + admin
        const updatedGroup = await ChatRoom.findById(chatRoomId)
            .populate("members")
            .populate("admin");

        const sysMsg = await Message.create({
            sender: SYSTEM_USER_ID,
            chatRoom: chatRoomId,
            isSystem: true,
            content: `${updatedGroup.admin.userName} removed ${member.userName} from the group.`
        });

        // Send updates to remaining members
        updatedGroup.members.forEach(mem => {
            io.to(mem._id.toString()).emit("memberRemoved", {
                members: updatedGroup.members,
                chatRoomId
            });

            io.to(mem._id.toString()).emit("receiveMessage", sysMsg);

            io.to(mem._id.toString()).emit("incrementUnread", {
                message: sysMsg,
                chatRoomId
            });
        });

        // Notify the removed user separately
        io.to(member._id.toString()).emit("removedFromGrp", {
            chatRoomId,
            message: "You have been removed from this group."
        });

        return res.status(200).json({
            success: true,
            message: "Member removed successfully"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false });
    }
};

export const exitGrp = async (req, res) => {
    const { chatRoomId } = req.body;
    const user = req.id.userId;

    try {
        const chatRoom = await ChatRoom.findById(chatRoomId).populate("members");
        if (!chatRoom) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        const exitedUser = chatRoom.members.find(
            mem => mem._id.toString() === user
        );

        if (!exitedUser) {
            return res.status(400).json({
                success: false,
                message: "User is not part of this group",
            });
        }

        // Remove user
        await ChatRoom.findByIdAndUpdate(chatRoomId, {
            $pull: { members: user },
        });

        const updatedGroup = await ChatRoom.findById(chatRoomId).populate("members");






        let adminChanged = false;
        let newAdmin = null;

        if (chatRoom.admin.toString() === user && updatedGroup.members.length > 0) {
            newAdmin = updatedGroup.members[0];

            await ChatRoom.findByIdAndUpdate(chatRoomId, {
                admin: newAdmin._id,
            });

            // Keep in-memory object in sync
            updatedGroup.admin = newAdmin._id;
            adminChanged = true;
        }




        io.to(user).emit("exitGrp", {
            chatRoomId,
            message: `You left ${chatRoom?.name}`,
        });

        // If no members left → delete group
        if (!updatedGroup || updatedGroup.members.length === 0) {
            await ChatRoom.findByIdAndDelete(chatRoomId);
            return res.status(200).json({
                success: true,
                message: "Group deleted because it had no members",
            });
        }

        // 1️⃣ Exit system message
        const exitMsg = await Message.create({
            chatRoom: chatRoomId,
            sender: SYSTEM_USER_ID,
            isSystem: true,
            content: `${exitedUser.userName} left the group`,
        });

        updatedGroup.members.forEach(mem => {

            io.to(mem._id.toString()).emit("memberExitGrp", {
                chatRoomId,
                members: updatedGroup?.members,
                admin: updatedGroup?.admin,
            });

            io.to(mem._id.toString()).emit("receiveMessage", exitMsg);

            io.to(mem._id.toString()).emit("incrementUnread", {
                message: exitMsg,
                chatRoomId,
            });

        });



        // 2️⃣ Admin promotion (AFTER exit message)
        if (adminChanged) {

            const adminMsg = await Message.create({
                chatRoom: chatRoomId,
                sender: SYSTEM_USER_ID,
                isSystem: true,
                content: `${newAdmin.userName} is now the group admin`,
            });

            updatedGroup.members.forEach(mem => {
                io.to(mem._id.toString()).emit("receiveMessage", adminMsg);
                io.to(mem._id.toString()).emit("incrementUnread", {
                    message: adminMsg,
                    chatRoomId,
                });
            });
        }

        return res.status(200).json({
            success: true,
            message: "User exited successfully",
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


export const deleteGrp = async (req, res) => {
    const { chatRoomId } = req.body;
     
            
    try {
        const chatRoom = await ChatRoom.findById(chatRoomId)
            .populate("members")
            .populate("admin");

        if (!chatRoom) {
            return res.status(404).json({
                success: false,
                message: "Group not found",
            });
        }

        await Message.deleteMany({ chatRoom: chatRoomId });
        await ChatRoom.findByIdAndDelete(chatRoomId);
         
         
        chatRoom.members.forEach(mem => {
            io.to(mem._id.toString()).emit("grpDeleted", {
                chatRoomId,
                message: `This group "${chatRoom.name}" was deleted by ${chatRoom?.admin?.userName}`,
            });
        });

        return res.status(200).json({
            success: true,
            message: "Group deleted successfully",
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
