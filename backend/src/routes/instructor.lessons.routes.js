// routes/instructor.lessons.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { getLessonForEdit } from '../controllers/instructor.lessons.controller.js';
import { updateLessonForEdit } from '../controllers/instructor.lessons.controller.js';

const router = Router();
router.get('/:id', requireAuth, requireRole('instructor', 'admin'), getLessonForEdit);
router.put('/:id', requireAuth, requireRole('instructor','admin'), updateLessonForEdit);

export default router;
