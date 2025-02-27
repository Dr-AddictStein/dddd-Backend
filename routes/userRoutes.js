import express from 'express';
import { checkUser, getAllUser, loginUser, singupUser } from '../controllers/userController.js';

const router = express.Router();


router.post('/login', loginUser)
router.post('/signup', singupUser)
router.post('/checkUser', checkUser)
router.get('/getAllUser', getAllUser)


export default router;