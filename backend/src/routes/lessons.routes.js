import { Router } from 'express';
import { getLessonDetail } from '../controllers/lessons.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import questionsRoutes from './questions.routes.js';

const router = Router();

// trước đây: requireAuth, requireRole('student')
router.get('/:id', requireAuth, getLessonDetail);
router.use('/:lessonId/questions', questionsRoutes);

export default router;
