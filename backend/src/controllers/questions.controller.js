import { prisma } from '../lib/db.js';
import { assertCleanContent } from '../lib/content-filter.js';

// GET /api/lessons/:lessonId/questions
export async function listQuestions(req, res) {
  try {
    const lessonId = Number(req.params.lessonId);
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });

    const rows = await prisma.lessonQuestion.findMany({
      where: { lessonId, parentId: null, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
        replies: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
          },
        },
      },
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list questions' });
  }
}

// POST /api/lessons/:lessonId/questions
// body: { content, parentId? }
export async function createQuestion(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const lessonId = Number(req.params.lessonId);
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });
    const { content, parentId } = req.body || {};
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'content required' });
    }
    assertCleanContent(content);

    // if parentId provided, ensure same lesson
    if (parentId) {
      const parent = await prisma.lessonQuestion.findUnique({ where: { id: Number(parentId) } });
      if (!parent || parent.lessonId !== lessonId) {
        return res.status(400).json({ error: 'Invalid parentId' });
      }
    }

    const row = await prisma.lessonQuestion.create({
      data: {
        lessonId,
        userId,
        content: content.trim(),
        parentId: parentId ? Number(parentId) : null,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        parentId: true,
      },
    });

    res.json({ ok: true, question: row });
  } catch (err) {
    console.error(err);
    if (err?.code === 'BAD_CONTENT') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create question' });
  }
}

// DELETE /api/lessons/:lessonId/questions/:id
export async function deleteQuestion(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthenticated' });
    const lessonId = Number(req.params.lessonId);
    const id = Number(req.params.id);
    if (!id || !lessonId) return res.status(400).json({ error: 'Invalid params' });

    const existing = await prisma.lessonQuestion.findUnique({
      where: { id },
      select: { id: true, userId: true, lessonId: true },
    });
    if (!existing || existing.lessonId !== lessonId) return res.status(404).json({ error: 'Not found' });

    const canDelete = user.role === 'admin' || user.role === 'instructor' || user.id === existing.userId;
    if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

    await prisma.lessonQuestion.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
}
