// routes/admin.routes.js
import { Router } from 'express';
import { requireAdmin } from '../middlewares/admin.middleware.js';

import {
  adminListCourses, adminPublishCourse, adminFeatureCourse, adminUpdateCourseSEO,
  adminCreateCourse, adminUpdateCourse, adminDeleteCourse,
  adminCreateModule, adminUpdateModule, adminDeleteModule,
  adminCreateLesson, adminUpdateLesson, adminDeleteLesson,
  adminGetCourseForEdit,
} from '../controllers/admin.courses.controller.js';

import {
  adminListUsers, adminSetUserRole,
  adminCreateUser, adminUpdateUser, adminDeleteUser, adminListRoles,
} from '../controllers/admin.users.controller.js';

import { adminListLogs } from '../controllers/admin.logs.controller.js';
import { adminGetStats } from '../controllers/admin.stats.controller.js';
import {
  adminListRoleRequests,
  adminApproveRoleRequest,
  adminRejectRoleRequest,
} from '../controllers/admin.role-requests.controller.js';


const router = Router();

/* ---------- Courses (list + duyệt/SEO/featured) ---------- */
router.get('/courses', requireAdmin, adminListCourses);
router.put('/courses/:id/publish', requireAdmin, adminPublishCourse);
router.put('/courses/:id/feature', requireAdmin, adminFeatureCourse);
router.put('/courses/:id/seo', requireAdmin, adminUpdateCourseSEO);

/* ---------- Courses CRUD (Admin) ---------- */
router.post('/courses', requireAdmin, adminCreateCourse);
router.put('/courses/:id', requireAdmin, adminUpdateCourse);
router.delete('/courses/:id', requireAdmin, adminDeleteCourse);
router.get('/courses/:id', requireAdmin, adminGetCourseForEdit);

/* ---------- Modules CRUD (Admin) ---------- */
router.post('/courses/:id/modules', requireAdmin, adminCreateModule);
router.put('/modules/:moduleId', requireAdmin, adminUpdateModule);
router.delete('/modules/:moduleId', requireAdmin, adminDeleteModule);

/* ---------- Lessons CRUD (Admin) ---------- */
router.post('/modules/:moduleId/lessons', requireAdmin, adminCreateLesson);
router.put('/lessons/:lessonId', requireAdmin, adminUpdateLesson);
router.delete('/lessons/:lessonId', requireAdmin, adminDeleteLesson);

/* ---------- Users ---------- */
router.get('/users', requireAdmin, adminListUsers);
router.put('/users/:id/role', requireAdmin, adminSetUserRole);
router.get('/roles', requireAdmin, adminListRoles);

/* ---------- Users CRUD (Admin) ---------- */
router.post('/users', requireAdmin, adminCreateUser);
router.put('/users/:id', requireAdmin, adminUpdateUser);
router.delete('/users/:id', requireAdmin, adminDeleteUser);

/* ---------- Logs ---------- */
router.get('/logs', requireAdmin, adminListLogs);

/* ---------- Stats ---------- */
router.get('/stats', requireAdmin, adminGetStats);

/* ---------- Role Requests ---------- */
router.get('/role-requests', requireAdmin, adminListRoleRequests);
router.post('/role-requests/:id/approve', requireAdmin, adminApproveRoleRequest);
router.post('/role-requests/:id/reject', requireAdmin, adminRejectRoleRequest);
export default router;
