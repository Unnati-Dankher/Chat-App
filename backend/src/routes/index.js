import express from 'express';
const router = express.Router();
import { passport } from "../middleware/authMiddleware.js";
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import chatRoutes from './chatRoutes.js';
import messageRoutes from './messageRoutes.js';

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/chat', chatRoutes);
router.use('/message', messageRoutes);

export default router;

