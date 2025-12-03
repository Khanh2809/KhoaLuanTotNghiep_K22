import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Chỉ cho phép owner (instructorId === req.user.id) thao tác
export async function ensureCourseOwner(req, res, next) {
  try {
    const courseId = Number(req.params.id || req.body.courseId);
    if (!courseId) return res.status(400).json({ error: 'courseId required' });

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (course.instructorId !== req.user?.id) return res.status(403).json({ error: 'Forbidden' });

    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ownership check failed' });
  }
}
    