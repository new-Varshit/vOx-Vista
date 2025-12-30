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
    lastMessage:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Message'
    },
    hasMessage:{
         type: Boolean,
         required: true,
         default: false
    },
    deletedFor:[
        {
         type:mongoose.Schema.Types.ObjectId,
         ref:'User'
        }
    ],
    isGroupChat: {
        type: Boolean,
        default: false
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    groupIcon:{
        type:String,
        required:false
    }
    
}, { timestamps: true });

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);