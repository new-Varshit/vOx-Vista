import express from 'express';
import {updateProfile,searchUser} from '../controllers/user.controller.js';
import { upload } from '../middlewares/fileUpload.middleware.js';

const router = express.Router();

router.post('/updateProfile',upload.single('profilePic'),updateProfile);

router.get('/searchUser',searchUser)

export default router;