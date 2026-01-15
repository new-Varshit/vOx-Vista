import express from "express";
import { upload } from "../middlewares/fileUpload.middleware.js";
<<<<<<< HEAD
import {createOrGetChatRoom,getAllChatRooms,dltChatRoom,searchActiveChatRoom,createGroupChat, addMember,editGroupInfo,removeMember, exitGrp,deleteGrp} from '../controllers/chatRoom.controller.js';
=======
import {createOrGetChatRoom,getAllChatRooms,dltChatRoom,searchActiveChatRoom,createGroupChat} from '../controllers/chatRoom.controller.js';
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556

const router = express.Router();

router.post('/', createOrGetChatRoom);

router.get('/getAllChatRooms',getAllChatRooms);

router.post('/dltChatRoom/:chatRoomId',dltChatRoom);

router.get('/searchActiveChatRoom',searchActiveChatRoom)

router.post('/groupChat',upload.single('groupIcon'),createGroupChat);

<<<<<<< HEAD
router.post('/addMembers', addMember);

router.post('/groupInfoEdit',upload.single('groupIcon'),editGroupInfo);

router.post('/removeMember',removeMember);

router.post('/exitGrp',exitGrp);

router.post('/deleteGrp',deleteGrp);

=======
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
export default router;