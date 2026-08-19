import express from 'express';
import { passport } from '../middleware/authMiddleware.js';
import validate from "../middleware/validator.js";
import { getUsersForSidebar, updateProfile } from '../controllers/userController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', passport, getUsersForSidebar);
router.put('/update-profile', passport, upload.single('profilePic'), updateProfile);

export default router;
