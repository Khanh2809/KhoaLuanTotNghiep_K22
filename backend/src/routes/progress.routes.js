import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { upsertProgress, touchAccess } from '../controllers/progress.controller.js';

const router = Router();

// Đánh dấu hoàn thành / bỏ hoàn thành & lưu lastAccessed
router.post('/', requireAuth, requireRole('student'), upsertProgress);

// Ghi lastAccessed khi mở bài (idempotent)
router.post('/touch', requireAuth, requireRole('student'), touchAccess);

export default router;
