import { Router } from 'express';
import { listReviews, createReview, deleteReview } from '../controllers/reviews.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', listReviews);
router.post('/', requireAuth, createReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;
