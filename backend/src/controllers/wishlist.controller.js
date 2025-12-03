import { prisma } from '../lib/db.js';
// GET /api/wishlist?userId=1
export async function getWishlist(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const list = await prisma.wishlist.findMany({
      where: { userId: Number(userId) },
      select: { courseId: true, createdAt: true }
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get wishlist' });
  }
}

// POST /api/wishlist  { userId, courseId }
export async function addWishlist(req, res) {
  try {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) return res.status(400).json({ error: 'userId, courseId required' });

    const data = await prisma.wishlist.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {}
    });
    res.json({ ok: true, wishlist: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Add wishlist failed' });
  }
}

// DELETE /api/wishlist  body: { userId, courseId }
export async function removeWishlist(req, res) {
  try {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) return res.status(400).json({ error: 'userId, courseId required' });

    await prisma.wishlist.delete({
      where: { userId_courseId: { userId, courseId } }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Remove wishlist failed' });
  }
}
