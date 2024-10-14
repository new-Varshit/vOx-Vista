import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({

    name: {
        type: String, 
        required: false
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    isGroupChat: {
        type: Boolean,
        default: false
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

}, { timestamps: true });

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);