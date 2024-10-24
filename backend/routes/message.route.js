import express from 'express';
import {sendMessage, getMessagesByChatRoom,updateAllMsgsToDelivered,clrChatRoomMsgs,deleteSelectedMsgs,deleteMsgForEveryone, updateMsgsToRead,updateMsgToDelivered, updateMsgToRead} from '../controllers/message.controller.js'
import { upload } from '../middlewares/fileUpload.middleware.js';

const  router = express.Router();

router.post('/sendMessage',upload.array('attachments',5),sendMessage);

router.post('/updateAllMsgsToDelivered',updateAllMsgsToDelivered);

router.post('/updateMsgsToRead/:senderId',updateMsgsToRead);

router.post('/updateMsgToRead/:msgId',updateMsgToRead);

router.post('/updateMsgToDelivered/:msgId',updateMsgToDelivered);

router.post('/deleteMsgForEveryone/:msgId',deleteMsgForEveryone);

router.post('/deleteSelectedMsgs',deleteSelectedMsgs);

router.post('/clrChatRoomMsgs/:chatRoomId',clrChatRoomMsgs);

router.get('/:chatRoomId',getMessagesByChatRoom);



export default router;