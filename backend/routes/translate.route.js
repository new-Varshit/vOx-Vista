import express from 'express'
<<<<<<< HEAD
import {translateMsg, getTranslateLangs} from '../controllers/translate.controller.js';
=======
import {translateMsg,getListOfLanguages} from '../controllers/translate.controller.js';
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
const router = express.Router();

router.post('/translateMsg',translateMsg);

<<<<<<< HEAD
router.get('/getTranslateLangs',getTranslateLangs);
=======
router.get('/',getListOfLanguages);
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556

export default router