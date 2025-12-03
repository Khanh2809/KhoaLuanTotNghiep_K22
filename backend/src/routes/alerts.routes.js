import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { listAlerts, listRecommendations } from '../controllers/alerts.controller.js';

const router = Router();

router.get('/', requireAuth, listAlerts);
router.get('/recommendations', requireAuth, listRecommendations);

export default router;
