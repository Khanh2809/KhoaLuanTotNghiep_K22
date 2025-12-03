import { prisma } from '../lib/db.js';
// GET /api/bookmarks?userId=1&lessonId=101
export async function listBookmarks(req, res) {
  try {
    const { userId, lessonId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const where = { userId: Number(userId), ...(lessonId ? { lessonId: Number(lessonId) } : {}) };
    const items = await prisma.bookmark.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list bookmarks' });
  }
}

// POST /api/bookmarks { userId, lessonId, blockId?, note? }
export async function addBookmark(req, res) {
  try {
    const { userId, lessonId, blockId, note } = req.body;
    if (!userId || !lessonId) return res.status(400).json({ error: 'userId, lessonId required' });

    const item = await prisma.bookmark.create({
      data: { userId, lessonId, blockId: blockId ?? null, note: note ?? null }
    });
    res.json({ ok: true, bookmark: item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Add bookmark failed' });
  }
}

// DELETE /api/bookmarks/:id
export async function removeBookmark(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.bookmark.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Remove bookmark failed' });
  }
}
