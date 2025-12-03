import express from 'express';
import { listQuestions, createQuestion, deleteQuestion } from '../controllers/questions.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router({ mergeParams: true });

router.get('/', listQuestions);
router.post('/', requireAuth, createQuestion);
router.delete('/:id', requireAuth, deleteQuestion);

export default router;
