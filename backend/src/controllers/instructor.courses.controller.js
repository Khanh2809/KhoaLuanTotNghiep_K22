import { prisma } from '../lib/db.js';
// GET /api/instructor/courses/mine
export async function myCourses(req, res) {
  const uid = req.user.id;
  const rows = await prisma.course.findMany({
    where: { instructorId: uid },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true, thumbnailUrl: true, createdAt: true },
  });
  res.json(rows);
}

// GET /api/instructor/categories
export async function listCategories(req, res) {
  try {
    const categories = await prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
    res.json(categories);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load categories' });
  }
}

// POST /api/instructor/courses
export async function createCourse(req, res) {
  try {
    const uid = req.user.id;
    const { title, description, categoryId, thumbnailUrl } = req.body;
    const uploadedThumb = req.file ? `/images/${req.file.filename}` : null;
    if (!title) return res.status(400).json({ error: 'title required' });
    const c = await prisma.course.create({
      data: {
        title,
        description,
        categoryId: categoryId ?? null,
        thumbnailUrl: uploadedThumb ?? thumbnailUrl ?? null,
        instructorId: uid,
      },
      select: { id: true },
    });
    res.status(201).json({ id: c.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Create course failed' });
  }
}

// GET /api/instructor/courses/:id  (bao gồm outline)
export async function getCourseForEdit(req, res) {
  const id = Number(req.params.id);
  const c = await prisma.course.findUnique({
    where: { id },
    include: {
      category: true,
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!c) return res.status(404).json({ error: 'Course not found' });
  res.json(c);
}

// PATCH /api/instructor/courses/:id  (sửa meta & status)
export async function updateCourse(req, res) {
  try {
    const id = Number(req.params.id);
    const { title, description, categoryId, thumbnailUrl, status } = req.body;
    const uploadedThumb = req.file ? `/images/${req.file.filename}` : null;
    const c = await prisma.course.update({
      where: { id },
      data: {
        title, description,
        categoryId: categoryId ?? undefined,
        thumbnailUrl: uploadedThumb ?? thumbnailUrl ?? undefined,
        status: status ?? undefined, // 'DRAFT' | 'PUBLISHED'
      },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update course failed' });
  }
}

// --- MODULE CRUD ---

// POST /api/instructor/courses/:id/modules
export async function createModule(req, res) {
  const courseId = Number(req.params.id);
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  // tính order = max+1
  const max = await prisma.courseModule.aggregate({ where: { courseId }, _max: { order: true } });
  const order = (max._max.order ?? 0) + 1;

  const m = await prisma.courseModule.create({
    data: { courseId, title, order },
    select: { id: true, title: true, order: true },
  });
  res.status(201).json(m);
}

// PATCH /api/instructor/modules/:moduleId
export async function updateModule(req, res) {
  const moduleId = Number(req.params.moduleId);
  const { title, order } = req.body;
  const m = await prisma.courseModule.update({
    where: { id: moduleId },
    data: { title: title ?? undefined, order: order ?? undefined },
  });
  res.json({ ok: true });
}

// DELETE /api/instructor/modules/:moduleId
export async function deleteModule(req, res) {
  const moduleId = Number(req.params.moduleId);
  await prisma.courseModule.delete({ where: { id: moduleId } });
  res.json({ ok: true });
}

// --- LESSON CRUD ---

// POST /api/instructor/modules/:moduleId/lessons
export async function createLesson(req, res) {
  const moduleId = Number(req.params.moduleId);
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const max = await prisma.lesson.aggregate({ where: { moduleId }, _max: { order: true } });
  const order = (max._max.order ?? 0) + 1;

  const ls = await prisma.lesson.create({
    data: { moduleId, title, order },
    select: { id: true, title: true, order: true },
  });
  res.status(201).json(ls);
}

// PATCH /api/instructor/lessons/:lessonId
export async function updateLesson(req, res) {
  const lessonId = Number(req.params.lessonId);
  const { title, description, videoUrl, contentMd } = req.body;

  // contentMd -> block TEXT (1) và videoUrl -> block VIDEO (1). Đơn giản: upsert 1 block TEXT/VIDEO.
  const updated = await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.update({
      where: { id: lessonId },
      data: { title: title ?? undefined, description: description ?? undefined },
    });

    if (typeof contentMd === 'string') {
      // upsert TEXT block ở displayOrder=1
      const text = await tx.lessonBlock.findFirst({ where: { lessonId, blockType: 'TEXT' } });
      if (text) {
        await tx.lessonBlock.update({ where: { id: text.id }, data: { textMarkdown: contentMd, displayOrder: 1 }});
      } else {
        await tx.lessonBlock.create({ data: { lessonId, blockType: 'TEXT', displayOrder: 1, textMarkdown: contentMd }});
      }
    }

    if (typeof videoUrl === 'string') {
      const vid = await tx.lessonBlock.findFirst({ where: { lessonId, blockType: 'VIDEO' } });
      if (vid) {
        await tx.lessonBlock.update({ where: { id: vid.id }, data: { videoUrl, displayOrder: 2 }});
      } else {
        await tx.lessonBlock.create({ data: { lessonId, blockType: 'VIDEO', displayOrder: 2, videoUrl }});
      }
    }

    return lesson.id;
  });

  res.json({ ok: true, id: updated });
}

// DELETE /api/instructor/lessons/:lessonId
export async function deleteLesson(req, res) {
  const lessonId = Number(req.params.lessonId);
  await prisma.lesson.delete({ where: { id: lessonId } });
  res.json({ ok: true });
}

