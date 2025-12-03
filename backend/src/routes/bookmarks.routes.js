import { Router } from 'express';
import { listBookmarks, addBookmark, removeBookmark } from '../controllers/bookmarks.controller.js';
const router = Router();

router.get('/', listBookmarks);
router.post('/', addBookmark);
router.delete('/:id', removeBookmark);

export default router;
