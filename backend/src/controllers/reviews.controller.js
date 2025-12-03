import { prisma } from '../lib/db.js';
import { assertCleanContent } from '../lib/content-filter.js';

// GET /api/reviews?courseId=1
export async function listReviews(req, res) {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    const reviews = await prisma.courseReview.findMany({
      where: { courseId: Number(courseId) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        review: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list reviews' });
  }
}

// POST /api/reviews
// body: { courseId, rating (1..5), review? } - user lấy từ req.user
export async function createReview(req, res) {
  try {
    const { courseId, rating, review } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    if (!courseId || !rating) return res.status(400).json({ error: 'courseId, rating required' });
    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'rating must be 1..5' });

    if (review) {
      assertCleanContent(review);
    }

    const data = await prisma.courseReview.upsert({
      where: { courseId_userId: { courseId, userId } },
      create: { userId, courseId, rating: ratingNum, review },
      update: { rating: ratingNum, review },
    });

    res.json({ ok: true, review: data });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'Already reviewed' });
    if (err?.code === 'BAD_CONTENT') return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Failed to create review' });
  }
}

// DELETE /api/reviews/:id
export async function deleteReview(req, res) {
  try {
    const id = Number(req.params.id);
    const reviewer = req.user;
    if (!reviewer) return res.status(401).json({ error: 'Unauthenticated' });

    const existing = await prisma.courseReview.findUnique({
      where: { id },
      select: { id: true, userId: true, courseId: true },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const canDelete =
      reviewer.role === 'admin' ||
      reviewer.role === 'instructor' ||
      reviewer.id === existing.userId;
    if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

    await prisma.courseReview.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}
