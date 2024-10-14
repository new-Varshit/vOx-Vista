import mongoose from "mongoose";
import {Schema} from "mongoose";

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profile: {
        profilePic: {
            type: String,
            default:'https://res.cloudinary.com/meovercloud/image/upload/v1727717288/v0x-Vista/xxjnxeld58gfmbjm8vxi.jpg'
        },
        bio:{
         type:String,
         default:'Don\'t have time to change the status'
        },
        status: {
            type: String,
            default:'offline'
        }
    }

},{timestamps:true}
)

export const User = mongoose.model('User',userSchema);