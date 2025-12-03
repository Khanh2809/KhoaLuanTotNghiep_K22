import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  listPaths,
  createPath,
  enrollPath,
  publishPath,
  getPathDetail,
} from '../controllers/learning-paths.controller.js';

const router = Router();

router.get('/', listPaths);
router.get('/:id', getPathDetail);
router.post('/', requireAuth, createPath);
router.post('/:pathId/enroll', requireAuth, enrollPath);
router.patch('/:pathId/publish', requireAuth, publishPath);

export default router;
