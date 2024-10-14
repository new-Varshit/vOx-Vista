import express from 'express'
const router = express.Router();
import {login,signup,checkSession,logOut} from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.middleware.js';


router.post('/login',login);

router.post('/signup',signup);

router.post('/logout',auth,logOut);

router.get('/check-session',auth,checkSession);


export default router;