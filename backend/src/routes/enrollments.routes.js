import { Router } from 'express';
import { enrollCourse, myEnrollments, enrollmentStatus } from '../controllers/enrollments.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, requireRole('student','instructor'), enrollCourse);
router.get('/me', requireAuth, requireRole('student'), myEnrollments);

router.get('/status/:courseId', requireAuth, requireRole('student'), enrollmentStatus);

export default router;
