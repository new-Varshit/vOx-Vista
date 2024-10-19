import express from "express";
import {createOrGetChatRoom,getAllChatRooms,dltChatRoom} from '../controllers/chatRoom.controller.js';

const router = express.Router();

router.post('/', createOrGetChatRoom);

router.get('/getAllChatRooms',getAllChatRooms);

router.post('/dltChatRoom/:chatRoomId',dltChatRoom);

export default router;