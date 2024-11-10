import express from 'express'
import {translateMsg,getListOfLanguages} from '../controllers/translate.controller.js';
const router = express.Router();

router.post('/translateMsg',translateMsg);

router.get('/',getListOfLanguages);

export default router