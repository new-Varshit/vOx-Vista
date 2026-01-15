import express from 'express'
import {translateMsg, getTranslateLangs} from '../controllers/translate.controller.js';
const router = express.Router();

router.post('/translateMsg',translateMsg);

router.get('/getTranslateLangs',getTranslateLangs);

export default router