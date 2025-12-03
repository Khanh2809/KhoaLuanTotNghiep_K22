import { Router } from 'express';
import { getWishlist, addWishlist, removeWishlist } from '../controllers/wishlist.controller.js';
const router = Router();

router.get('/', getWishlist);
router.post('/', addWishlist);
router.delete('/', removeWishlist);

export default router;
