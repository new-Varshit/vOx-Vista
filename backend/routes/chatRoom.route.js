import express from "express";
import {createOrGetChatRoom,getAllChatRooms,dltChatRoom,searchActiveChatRoom} from '../controllers/chatRoom.controller.js';

const router = express.Router();

router.post('/', createOrGetChatRoom);

router.get('/getAllChatRooms',getAllChatRooms);

router.post('/dltChatRoom/:chatRoomId',dltChatRoom);

router.get('/searchActiveChatRoom',searchActiveChatRoom)

export default router;