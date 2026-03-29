import express from "express";
import { upload } from "../middlewares/fileUpload.middleware.js";
import {createOrGetChatRoom,getAllChatRooms,dltChatRoom,searchActiveChatRoom,createGroupChat, addMember,editGroupInfo,removeMember, exitGrp,deleteGrp, setGroupModeration} from '../controllers/chatRoom.controller.js';

const router = express.Router();

router.post('/', createOrGetChatRoom);

router.get('/getAllChatRooms',getAllChatRooms);

router.post('/dltChatRoom/:chatRoomId',dltChatRoom);

router.get('/searchActiveChatRoom',searchActiveChatRoom)

router.post('/groupChat',upload.single('groupIcon'),createGroupChat);

router.post('/addMembers', addMember);

router.post('/groupInfoEdit',upload.single('groupIcon'),editGroupInfo);

router.post('/removeMember',removeMember);

router.post('/exitGrp',exitGrp);

router.post('/deleteGrp',deleteGrp);

router.post('/moderation', setGroupModeration);

export default router;