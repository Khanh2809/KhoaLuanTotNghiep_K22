import { prisma } from '../lib/db.js';
// POST /api/enrollments
export async function enrollCourse(req, res) {
  try {
    const userId = req.user?.id;           // lấy từ JWT
    const { courseId } = req.body;
    if (!userId || !courseId) return res.status(400).json({ error: 'userId/courseId required' });

    const data = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: Number(courseId) } },
      create: { userId, courseId: Number(courseId) },
      update: {},
    });

    res.json({ ok: true, enrollment: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Enroll failed' });
  }
}

// GET /api/enrollments/me
export async function myEnrollments(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // lấy danh sách enroll + tiêu đề khóa học
    const rows = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // tính % hoàn thành (đơn giản, tránh N+1)
    // tổng lessons/khóa
    const courseIds = rows.map(r => r.courseId);
    const totalByCourse = await prisma.lesson.groupBy({
      by: ['moduleId'],
      _count: { moduleId: true },
    }); // (tuỳ schema; nếu Lesson có relation tới Module & Module có courseId)

    // cách gọn hơn, đỡ phức tạp: set progressPct = null (ta sẽ tính đúng khi làm trang học)
    const items = rows.map(r => ({
      id: r.id,
      course: r.course,          // { id, title }
      progressPct: null,
      updatedAt: r.enrolledAt,
    }));

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load enrollments' });
  }
}
export async function enrollmentStatus(req, res) {
  try {
    const userId = req.user?.id;
    const courseId = Number(req.params.courseId);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!courseId) return res.status(400).json({ error: 'courseId required' });

    const found = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });

    return res.json({ enrolled: !!found });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check status' });
  }
}