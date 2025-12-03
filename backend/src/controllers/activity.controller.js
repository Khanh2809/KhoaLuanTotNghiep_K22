// src/controllers/activity.controller.js
import { prisma } from '../lib/db.js';

/**
 * POST /api/logs
 * Body:
 * {
 *   "eventType": "LESSON_OPEN",
 *   "courseId": 1,
 *   "lessonId": 10,
 *   "metadata": { "quizId": 3 }
 * }
 */
export async function createLog(req, res) {
  try {
    const userId = req.user?.id; // requireAuth đã gắn req.user = { id, role }
    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const { eventType, courseId, lessonId, metadata } = req.body;

    if (!eventType || typeof eventType !== 'string') {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const log = await prisma.activityLog.create({
      data: {
        userId: Number(userId),
        eventType,
        courseId: courseId ? Number(courseId) : null,
        lessonId: lessonId ? Number(lessonId) : null,
        metadata: metadata ?? undefined,
      },
    });

    res.status(201).json(log);
  } catch (e) {
    console.error('Failed to create activity log', e);
    res.status(500).json({ error: 'Failed to create activity log' });
  }
}
