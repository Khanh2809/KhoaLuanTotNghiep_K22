import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { chatInLesson } from '../controllers/chat.controller.js';

const router = Router();
router.post('/', requireAuth, chatInLesson);

export default router;
