import { Router } from 'express';
import { listCourses, getCourseDetail, listCategoriesPublic } from '../controllers/courses.controller.js';
const router = Router();

router.get('/', listCourses);
router.get('/categories', listCategoriesPublic);
router.get('/:id', getCourseDetail);

export default router;
// POST /api/courses
