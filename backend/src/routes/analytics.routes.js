import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  getCoursePerformance,
  getCourseEngagement,
  getCourseBehavior,
  getCourseAnalytics,
  getStudentCourseAnalytics,
  getStudentCourseSummary,
  getCourseSummary,
} from '../controllers/analytics.controller.js';

const router = Router();

router.get('/performance', requireAuth, getCoursePerformance);
router.get('/engagement', requireAuth, getCourseEngagement);
router.get('/behavior', requireAuth, getCourseBehavior);
router.get('/course/:courseId', requireAuth, getCourseAnalytics);
router.get('/student/course/:courseId', requireAuth, getStudentCourseAnalytics);
router.post('/summary', requireAuth, getCourseSummary);
router.post('/student/summary', requireAuth, getStudentCourseSummary);

export default router;
