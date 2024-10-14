import express from 'express';
import {sendMessage, getMessagesByChatRoom,updateAllMsgsToDelivered, updateMsgsToRead,updateMsgToDelivered, updateMsgToRead} from '../controllers/message.controller.js'

const  router = express.Router();

router.post('/sendMessage',sendMessage);

router.post('/updateAllMsgsToDelivered',updateAllMsgsToDelivered);

router.post('/updateMsgsToRead/:senderId',updateMsgsToRead);

router.post('/updateMsgToRead/:msgId',updateMsgToRead);

router.post('/updateMsgToDelivered/:msgId',updateMsgToDelivered);

router.get('/:chatRoomId',getMessagesByChatRoom);

export default router;