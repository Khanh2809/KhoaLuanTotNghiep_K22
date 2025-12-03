// src/routes/activity.routes.js
import { Router } from 'express';
import { createLog } from '../controllers/activity.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Chỉ user đã đăng nhập mới được log
router.post('/', requireAuth, createLog);

export default router;
