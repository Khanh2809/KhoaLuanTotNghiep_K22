import { prisma } from '../lib/db.js';
// POST /api/progress { lessonId, isCompleted? }
export async function upsertProgress(req, res) {
  try {
    const userId = req.user?.id;
    const { lessonId, isCompleted } = req.body;
    if (!userId || !lessonId) return res.status(400).json({ error: 'lessonId required' });

    const data = await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: Number(lessonId) } },
      create: { userId, lessonId: Number(lessonId), isCompleted: !!isCompleted },
      update: { isCompleted: typeof isCompleted === 'boolean' ? isCompleted : undefined, lastAccessed: new Date() },
    });

    res.json({ ok: true, progress: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update progress' });
  }
}

// POST /api/progress/touch { lessonId }
export async function touchAccess(req, res) {
  try {
    const userId = req.user?.id;
    const { lessonId } = req.body;
    if (!userId || !lessonId) return res.status(400).json({ error: 'lessonId required' });

    const data = await prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: Number(lessonId) } },
      create: { userId, lessonId: Number(lessonId) }, // isCompleted mặc định false
      update: { lastAccessed: new Date() },
    });

    res.json({ ok: true, progress: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to touch progress' });
  }
}
