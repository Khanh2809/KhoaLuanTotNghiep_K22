import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { ensureCourseOwner } from '../middlewares/owner.middleware.js';
import {
  myCourses, listCategories, createCourse, getCourseForEdit, updateCourse,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson
} from '../controllers/instructor.courses.controller.js';

const r = Router();
r.use(requireAuth, requireRole('instructor','admin'));

// list/create
r.get('/courses/mine', myCourses);
r.get('/categories', listCategories);
r.post('/courses', createCourse);

// read/update course (owner)
r.get('/courses/:id', ensureCourseOwner, getCourseForEdit);
r.patch('/courses/:id', ensureCourseOwner, updateCourse);

// module CRUD (owner: dựa theo courseId -> truyền vào body/ensure phía client? đơn giản: check bằng join)
r.post('/courses/:id/modules', ensureCourseOwner, createModule);
r.patch('/modules/:moduleId', updateModule);
r.delete('/modules/:moduleId', deleteModule);

// lesson CRUD
r.post('/modules/:moduleId/lessons', createLesson);
r.patch('/lessons/:lessonId', updateLesson);
r.delete('/lessons/:lessonId', deleteLesson);

export default r;
