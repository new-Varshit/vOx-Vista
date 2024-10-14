import express from 'express';
import {updateProfile,searchUser} from '../controllers/user.controller.js';
import { singleUpload } from '../middlewares/fileUpload.middleware.js';

const router = express.Router();

router.post('/updateProfile',singleUpload.single('profilePic'),updateProfile);

router.get('/searchUser',searchUser)

export default router;