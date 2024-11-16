import express from "express";
import { upload } from "../middlewares/fileUpload.middleware.js";
import {createOrGetChatRoom,getAllChatRooms,dltChatRoom,searchActiveChatRoom,createGroupChat} from '../controllers/chatRoom.controller.js';

const router = express.Router();

router.post('/', createOrGetChatRoom);

router.get('/getAllChatRooms',getAllChatRooms);

router.post('/dltChatRoom/:chatRoomId',dltChatRoom);

router.get('/searchActiveChatRoom',searchActiveChatRoom)

router.post('/groupChat',upload.single('groupIcon'),createGroupChat);

export default router;