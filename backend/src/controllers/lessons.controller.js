import { prisma } from '../lib/db.js';
// GET /api/lessons/:id
export async function getLessonDetail(req, res) {
  try {
    const userId = req.user?.id;
    const role   = req.user?.role;               // 'student' | 'instructor' | 'admin'
    const id     = Number(req.params.id);

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: { include: { course: { select: { id:true, title:true, instructorId:true } } } },
        blocks: { orderBy: { displayOrder: 'asc' } },
        resources: true,
      },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const courseId = lesson.module.course.id;
    const isOwner  = role === 'admin' ||
                     (role === 'instructor' && lesson.module.course.instructorId === userId);

    let progress = null;

    if (!isOwner) {
      // student flow: phải enrolled + touch lastAccessed
      const enrolled = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } }, select: { id: true },
      });
      if (!enrolled) return res.status(403).json({ error: 'Not enrolled' });

      await prisma.userProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: id } },
        create: { userId, lessonId: id },
        update: { lastAccessed: new Date() },
      });

      progress = await prisma.userProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: id } },
        select: { isCompleted: true, lastAccessed: true },
      });
    }
    // owner/admin: không sờ vào progress

    return res.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      course: { id: courseId, title: lesson.module.course.title },
      blocks: lesson.blocks,
      resources: lesson.resources,
      progress,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get lesson' });
  }
}
