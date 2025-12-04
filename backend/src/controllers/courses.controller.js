import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db.js';

// Read token if present (not required) to determine current user
function getOptionalUserId(req) {
  if (req.user?.id) return Number(req.user.id);
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return Number(payload?.id) || null;
  } catch {
    return null;
  }
}

// Public list categories for filters
export async function listCategoriesPublic(_req, res) {
  try {
    const categories = await prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list categories' });
  }
}

// GET /api/courses?q=&cat=&level=&sort=&page=&pageSize=
export async function listCourses(req, res) {
  try {
    const {
      q,
      cat,
      level,
      sort = 'recent', // recent | rating
      page = '1',
      pageSize = '12',
    } = req.query;

    const where = {
      status: 'PUBLISHED',
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      ...(cat ? { categoryId: Number(cat) || undefined } : {}),
      ...(level ? {} : {}), // placeholder
    };

    const take = Math.min(parseInt(pageSize, 10) || 12, 50);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const orderBy = [{ createdAt: 'desc' }];

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          thumbnailUrl: true,
          category: { select: { name: true } },
          instructor: { select: { name: true } },
          reviews: { select: { rating: true } },
          modules: { select: { lessons: { select: { id: true } } } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const mapped = items.map((c) => {
      const ratings = c.reviews.map((r) => r.rating);
      const ratingAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const lessonCount = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category?.name ?? null,
        instructor: c.instructor?.name ?? null,
        ratingAvg: Number(ratingAvg.toFixed(2)),
        lessonCount,
        thumbnailUrl: c.thumbnailUrl ?? null,
      };
    });

    if (sort === 'rating') {
      mapped.sort((a, b) => b.ratingAvg - a.ratingAvg);
    }

    res.json({
      items: mapped,
      pagination: { total, page: Number(page), pageSize: take },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list courses' });
  }
}

// GET /api/courses/:id
export async function getCourseDetail(req, res) {
  try {
    const currentUserId = getOptionalUserId(req);
    const id = Number(req.params.id);
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, title: true, order: true, quizzes: { select: { id: true } } },
            },
          },
        },
        reviews: { select: { rating: true } },
      },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Determine owner/admin
    const requester = req.user ?? null;
    const isOwner =
      (requester?.role === 'instructor' &&
        !!(await prisma.course.findFirst({
          where: { id, instructorId: requester.id },
          select: { id: true },
        }))) ||
      requester?.role === 'admin';

    // Block if unpublished for non-owner
    if (!isOwner && course.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'Course not published' });
    }

    const ratings = course.reviews.map((r) => r.rating);
    const ratingAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const enrolled = currentUserId
      ? !!(await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: currentUserId, courseId: id } },
          select: { id: true },
        }))
      : false;

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category?.name ?? null,
      instructor: course.instructor, // { id, name }
      ratingAvg: Number(ratingAvg.toFixed(2)),
      thumbnailUrl: course.thumbnailUrl ?? null,
      status: course.status,
      isOwner,
      enrolled,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: m.lessons.map((ls) => ({
          id: ls.id,
          title: ls.title,
          order: ls.order,
          quizId: ls.quizzes?.[0]?.id ?? null,
        })),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get course detail' });
  }
}

