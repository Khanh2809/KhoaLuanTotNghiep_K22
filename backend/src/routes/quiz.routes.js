import { Router } from 'express';
import * as quiz from '../controllers/quiz.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// List quizzes by course
router.get(
  '/courses/:id/quizzes',
  requireAuth,
  requireRole('instructor', 'admin'),
  quiz.listQuizzesByCourse
);

// CRUD quiz
router.post('/quizzes', requireAuth, quiz.createQuiz);
router.get('/quizzes/:id', requireAuth, quiz.getQuiz);
router.patch('/quizzes/:id', requireAuth, quiz.updateQuiz);
router.delete('/quizzes/:id', requireAuth, quiz.deleteQuiz);

// Questions
router.post('/quizzes/:id/questions', requireAuth, quiz.addQuestion);
router.patch('/questions/:qid', requireAuth, quiz.updateQuestion);
router.delete('/questions/:qid', requireAuth, quiz.deleteQuestion);

// Attempts / Submit
router.post('/quizzes/:id/start', requireAuth, quiz.startAttempt);
router.post('/quizzes/:id/submit', requireAuth, quiz.submitQuiz);
// get submission
router.get('/submissions/:sid', requireAuth, quiz.getSubmission);
export default router;
