// controllers/admin.courses.controller.js
import { auditLog } from '../lib/audit.js';
import { prisma } from '../lib/db.js';
/* ========== COURSES: list + publish/feature/seo ========== */

// GET /api/admin/courses?status=&q=&page=1&pageSize=20
export async function adminListCourses(req, res) {
  try {
    const { status, q, page = '1', pageSize = '20' } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {
      ...(status ? { status } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          status: true,
          featured: true,
          featuredRank: true,
          instructor: { select: { id: true, name: true } },
          reviewedAt: true,
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({ items, pagination: { total, page: Number(page), pageSize: take } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list courses' });
  }
}

// PUT /api/admin/courses/:id/publish { publish: boolean }
export async function adminPublishCourse(req, res) {
  try {
    const id = Number(req.params.id);
    const { publish } = req.body || {};
    const status = publish ? 'PUBLISHED' : 'DRAFT';

    const upd = await prisma.course.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: req.user.id,
      },
      select: { id: true, status: true },
    });

    await auditLog(req, {
      action: publish ? 'COURSE.PUBLISH' : 'COURSE.UNPUBLISH',
      targetType: 'course',
      targetId: id,
    });

    res.json(upd);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to change status' });
  }
}

// PUT /api/admin/courses/:id/feature { featured:boolean, rank?:number }
export async function adminFeatureCourse(req, res) {
  try {
    const id = Number(req.params.id);
    const { featured, rank } = req.body || {};
    const upd = await prisma.course.update({
      where: { id },
      data: { featured: !!featured, featuredRank: rank ?? null },
      select: { id: true, featured: true, featuredRank: true },
    });

    await auditLog(req, {
      action: 'COURSE.FEATURE',
      targetType: 'course',
      targetId: id,
      meta: { featured: !!featured, rank },
    });

    res.json(upd);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to feature course' });
  }
}

// PUT /api/admin/courses/:id/seo { seoTitle?, seoDescription?, slug? }
export async function adminUpdateCourseSEO(req, res) {
  try {
    const id = Number(req.params.id);
    const { seoTitle, seoDescription, slug } = req.body || {};
    const upd = await prisma.course.update({
      where: { id },
      data: {
        seoTitle: seoTitle ?? null,
        seoDescription: seoDescription ?? null,
        slug: slug || null,
      },
      select: { id: true, seoTitle: true, seoDescription: true, slug: true },
    });

    await auditLog(req, {
      action: 'COURSE.SEO_UPDATE',
      targetType: 'course',
      targetId: id,
      meta: { seoTitle, slug },
    });

    res.json(upd);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update SEO' });
  }
}

/* ========== COURSES: Admin CRUD ========== */

// POST /api/admin/courses
// body: { title, description?, categoryId?, thumbnailUrl?, instructorId?, status? }
export async function adminCreateCourse(req, res) {
  try {
    const { title, description, categoryId, thumbnailUrl, instructorId, status = 'DRAFT' } =
      req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });

    const c = await prisma.course.create({
      data: {
        title,
        description: description ?? null,
        categoryId: categoryId ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        instructorId: instructorId ?? req.user.id, // mặc định gán admin
        status,
      },
      select: { id: true, title: true, status: true, instructorId: true },
    });

    await auditLog(req, { action: 'COURSE.CREATE', targetType: 'course', targetId: c.id });
    res.status(201).json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Create course failed' });
  }
}

// PUT /api/admin/courses/:id
// body: { title?, description?, categoryId?, thumbnailUrl?, status?, instructorId? }
export async function adminUpdateCourse(req, res) {
  try {
    const id = Number(req.params.id);
    const { title, description, categoryId, thumbnailUrl, status, instructorId } =
      req.body || {};
    const c = await prisma.course.update({
      where: { id },
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        categoryId: categoryId ?? undefined,
        thumbnailUrl: thumbnailUrl ?? undefined,
        status: status ?? undefined,
        instructorId: instructorId ?? undefined,
      },
      select: { id: true, title: true, status: true, instructorId: true },
    });

    await auditLog(req, { action: 'COURSE.UPDATE', targetType: 'course', targetId: id });
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update course failed' });
  }
}

// DELETE /api/admin/courses/:id
// export async function adminDeleteCourse(req, res) {
//   try {
//     const id = Number(req.params.id);
//     // Nếu schema không có ON DELETE CASCADE, hãy manual delete các con tại đây.
//     await prisma.course.delete({ where: { id } });

//     await auditLog(req, { action: 'COURSE.DELETE', targetType: 'course', targetId: id });
//     res.json({ ok: true });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: 'Delete course failed' });
//   }
// }

export async function adminDeleteCourse(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction(async (tx) => {
      const lessonIds = (await tx.lesson.findMany({ where: { module: { courseId: id } }, select:{id:true} })).map(x=>x.id);
      if (lessonIds.length) {
        await tx.userProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
        await tx.lessonBlock.deleteMany({ where: { lessonId: { in: lessonIds } } });
        await tx.lessonResource.deleteMany({ where: { lessonId: { in: lessonIds } } });
      }
      await tx.lesson.deleteMany({ where: { module: { courseId: id } } });
      await tx.courseModule.deleteMany({ where: { courseId: id } });
      await tx.enrollment.deleteMany({ where: { courseId: id } });
      await tx.courseReview.deleteMany({ where: { courseId: id } });
      await tx.wishlist.deleteMany({ where: { courseId: id } });
      await tx.certificate.deleteMany({ where: { courseId: id } });
      await tx.course.delete({ where: { id } });
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Delete course failed' });
  }
}

export async function adminGetCourseForEdit(req, res) {
  try {
    const id = Number(req.params.id);
    const c = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!c) return res.status(404).json({ error: 'Course not found' });
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load course' });
  }
}

/* ========== MODULES: Admin CRUD ========== */

// POST /api/admin/courses/:id/modules
// body: { title }
export async function adminCreateModule(req, res) {
  try {
    const courseId = Number(req.params.id);
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });

    const max = await prisma.courseModule.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    const order = (max._max.order ?? 0) + 1;

    const m = await prisma.courseModule.create({
      data: { courseId, title, order },
      select: { id: true, title: true, order: true },
    });

    await auditLog(req, {
      action: 'MODULE.CREATE',
      targetType: 'course',
      targetId: courseId,
      meta: { moduleId: m.id },
    });

    res.status(201).json(m);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Create module failed' });
  }
}

// PUT /api/admin/modules/:moduleId
// body: { title?, order? }
export async function adminUpdateModule(req, res) {
  try {
    const moduleId = Number(req.params.moduleId);
    const { title, order } = req.body || {};
    await prisma.courseModule.update({
      where: { id: moduleId },
      data: { title: title ?? undefined, order: order ?? undefined },
    });

    await auditLog(req, { action: 'MODULE.UPDATE', targetType: 'module', targetId: moduleId });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update module failed' });
  }
}

// DELETE /api/admin/modules/:moduleId
export async function adminDeleteModule(req, res) {
  try {
    const moduleId = Number(req.params.moduleId);
    await prisma.courseModule.delete({ where: { id: moduleId } });

    await auditLog(req, { action: 'MODULE.DELETE', targetType: 'module', targetId: moduleId });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Delete module failed' });
  }
}

/* ========== LESSONS: Admin CRUD ========== */

// POST /api/admin/modules/:moduleId/lessons
// body: { title }
export async function adminCreateLesson(req, res) {
  try {
    const moduleId = Number(req.params.moduleId);
    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });

    const max = await prisma.lesson.aggregate({
      where: { moduleId },
      _max: { order: true },
    });
    const order = (max._max.order ?? 0) + 1;

    const ls = await prisma.lesson.create({
      data: { moduleId, title, order },
      select: { id: true, title: true, order: true },
    });

    await auditLog(req, {
      action: 'LESSON.CREATE',
      targetType: 'lesson',
      targetId: ls.id,
      meta: { moduleId },
    });

    res.status(201).json(ls);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Create lesson failed' });
  }
}

// PUT /api/admin/lessons/:lessonId
// body: { title?, description?, order?, blocks?: [...] } (upsert giống instructor)
export async function adminUpdateLesson(req, res) {
  try {
    const id = Number(req.params.lessonId);
    let { title, description, order, blocks } = req.body || {};
    if (!Array.isArray(blocks)) blocks = [];

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { blocks: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    await prisma.$transaction(async (tx) => {
      await tx.lesson.update({
        where: { id },
        data: {
          title: title ?? lesson.title,
          description: typeof description === 'string' ? description : lesson.description,
          order: Number(order) || lesson.order,
        },
      });

      const incomingIds = blocks.filter((b) => b && b.id).map((b) => Number(b.id));
      const toDelete = lesson.blocks.filter((b) => !incomingIds.includes(b.id)).map((b) => b.id);

      if (toDelete.length) {
        await tx.lessonBlock.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const b of blocks) {
        if (!b) continue;
        const payload = {
          blockType: String(b.blockType || 'TEXT'),
          displayOrder: Number(b.displayOrder) || 1,
          textMarkdown: b.textMarkdown ?? null,
          imageUrl: b.imageUrl ?? null,
          imageAlt: b.imageAlt ?? null,
          caption: b.caption ?? null,
          videoUrl: b.videoUrl ?? null,
          videoDuration: b.videoDuration ? Number(b.videoDuration) : null,
          embedUrl: b.embedUrl ?? null,
          fileUrl: b.fileUrl ?? null,
        };

        if (b.id) {
          await tx.lessonBlock.update({ where: { id: Number(b.id) }, data: payload });
        } else {
          await tx.lessonBlock.create({ data: { lessonId: id, ...payload } });
        }
      }
    });

    await auditLog(req, { action: 'LESSON.UPDATE', targetType: 'lesson', targetId: id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update lesson failed' });
  }
}

// DELETE /api/admin/lessons/:lessonId
export async function adminDeleteLesson(req, res) {
  try {
    const id = Number(req.params.lessonId);
    await prisma.lesson.delete({ where: { id } });

    await auditLog(req, { action: 'LESSON.DELETE', targetType: 'lesson', targetId: id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Delete lesson failed' });
  }
}
