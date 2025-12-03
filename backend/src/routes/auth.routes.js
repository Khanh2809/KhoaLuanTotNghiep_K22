import { Router } from 'express';
import { login, register, me, logout, forgotPassword, resetPasswordController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Auth cơ bản
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// Forgot and Reset Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordController);

export default router;
