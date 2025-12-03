// controllers/admin.stats.controller.js
import { prisma } from '../lib/db.js';

export async function adminGetStats(req, res) {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      courses,
      users,
      lessons,
      logsToday,
      publishedCourses,
      draftCourses,
      enrollments,
      instructors,
      pendingRoleRequests,
      recentLogs,
      topCourses,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.user.count(),
      prisma.lesson.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.course.count({ where: { status: 'DRAFT' } }),
      prisma.enrollment.count(),
      prisma.user.count({ where: { role: { name: 'instructor' } } }),
      prisma.roleRequest.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.course.findMany({
        take: 5,
        orderBy: { enrollments: { _count: 'desc' } },
        select: {
          id: true,
          title: true,
          _count: { select: { enrollments: true } },
          status: true,
        },
      }),
    ]);

    res.json({
      courses,
      users,
      lessons,
      logsToday,
      publishedCourses,
      draftCourses,
      enrollments,
      instructors,
      pendingRoleRequests,
      recentLogs,
      topCourses: topCourses.map((c) => ({
        id: c.id,
        title: c.title,
        enrollments: c._count.enrollments,
        status: c.status,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}
