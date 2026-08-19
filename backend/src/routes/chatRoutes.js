import express from 'express';
import { passport } from '../middleware/authMiddleware.js';
import validate from "../middleware/validator.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/', passport, accessChat);
router.get('/', passport, fetchChats);
router.post('/group', passport, createGroupChat);
router.put('/rename', passport, renameGroup);
router.put('/groupadd', passport, addToGroup);
router.put('/groupremove', passport, removeFromGroup);

export default router;
