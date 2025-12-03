import { prisma } from '../lib/db.js';

// GET /api/search?q=&limit=
export async function globalSearch(req, res) {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 10);

    if (!q || q.length < 2) {
      return res.json({ courses: [], lessons: [] });
    }

    const [courses, lessons] = await Promise.all([
      prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          title: { contains: q, mode: 'insensitive' },
        },
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          instructor: { select: { name: true } },
        },
      }),
      prisma.lesson.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
          module: { course: { status: 'PUBLISHED' } },
        },
        take: Math.max(1, Math.min(limit, 8)),
        select: {
          id: true,
          title: true,
          module: {
            select: {
              courseId: true,
              course: { select: { title: true, id: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl ?? null,
        instructor: c.instructor?.name ?? null,
        type: 'course',
      })),
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        courseId: l.module?.courseId ?? null,
        courseTitle: l.module?.course?.title ?? null,
        type: 'lesson',
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search' });
  }
}
