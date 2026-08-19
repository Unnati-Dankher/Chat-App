import express from 'express';
import { signup, login, logout, checkAuth, refreshToken } from '../controllers/authController.js';
import { passport } from '../middleware/authMiddleware.js';
import validate from "../middleware/validator.js";

const router = express.Router();

router.post('/signup',validate("userSignup"), signup);
router.post('/login', login);
router.post("/refresh-token", refreshToken);
router.post('/logout', logout);
router.get('/check', passport, checkAuth);

export default router;
