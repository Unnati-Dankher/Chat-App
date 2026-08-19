import express from 'express';
import { passport } from '../middleware/authMiddleware.js';
import validate from "../middleware/validator.js";
import { sendMessage, allMessages } from '../controllers/messageController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', passport, upload.single('file'), sendMessage);
router.get('/:chatId', passport, allMessages);

export default router;
