import express from 'express';
import { globalSearch } from '../controllers/search.controller.js';

const router = express.Router();

// Public global search (courses + lessons)
router.get('/', globalSearch);

export default router;
