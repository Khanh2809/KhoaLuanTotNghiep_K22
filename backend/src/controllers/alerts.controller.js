import { prisma } from '../lib/db.js';

// GET /api/alerts?courseId=...
export async function listAlerts(req, res) {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const courseId = Number(req.query.courseId);
    if (!courseId || Number.isNaN(courseId)) return res.status(400).json({ error: 'Invalid courseId' });

    const alerts = await prisma.alert.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json(alerts);
  } catch (e) {
    console.error('listAlerts failed', e);
    return res.status(500).json({ error: 'Failed to load alerts' });
  }
}

// GET /api/alerts/recommendations?courseId=...
export async function listRecommendations(req, res) {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const courseId = Number(req.query.courseId);
    if (!courseId || Number.isNaN(courseId)) return res.status(400).json({ error: 'Invalid courseId' });

    const recs = await prisma.recommendation.findMany({
      where: { courseId, userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.json(recs);
  } catch (e) {
    console.error('listRecommendations failed', e);
    return res.status(500).json({ error: 'Failed to load recommendations' });
  }
}
