import express from "express";
import {createOrGetChatRoom,getAllChatRooms} from '../controllers/chatRoom.controller.js';

const router = express.Router();

router.post('/', createOrGetChatRoom);

router.get('/getAllChatRooms',getAllChatRooms);

export default router;