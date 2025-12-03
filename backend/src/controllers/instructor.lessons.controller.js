// controllers/instructor.lessons.controller.js
import { prisma } from '../lib/db.js';
export async function getLessonForEdit(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role; // 'instructor' | 'admin' | ...
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid lesson id' });

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true, instructorId: true, thumbnailUrl: true } },
          },
        },
        blocks: { orderBy: { displayOrder: 'asc' } },
        resources: true,
      },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const ownerId = lesson.module?.course?.instructorId;
    const isOwner = ownerId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden (not owner)' });
    }

    return res.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      moduleId: lesson.moduleId,
      course: {
        id: lesson.module.course.id,
        title: lesson.module.course.title,
        thumbnailUrl: lesson.module.course.thumbnailUrl ?? null,
      },
      blocks: lesson.blocks.map((b) => ({
        id: b.id,
        blockType: b.blockType,
        displayOrder: b.displayOrder,
        textMarkdown: b.textMarkdown,
        imageUrl: b.imageUrl,
        imageAlt: b.imageAlt,
        caption: b.caption,
        videoUrl: b.videoUrl,
        videoDuration: b.videoDuration,
        embedUrl: b.embedUrl,
        fileUrl: b.fileUrl,
      })),
      resources: lesson.resources.map((r) => ({
        id: r.id,
        resourceType: r.resourceType,
        resourceUrl: r.resourceUrl,
        uploadedAt: r.uploadedAt,
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load lesson for edit' });
  }
}

export async function updateLessonForEdit(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid lesson id' });

    let { title, description, order, blocks } = req.body || {};
    if (!Array.isArray(blocks)) blocks = [];

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } }, blocks: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const isOwner = lesson.module.course.instructorId === userId || userRole === 'admin';
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    await prisma.$transaction(async (tx) => {
      // Update lesson meta
      await tx.lesson.update({
        where: { id },
        data: {
          title: title ?? lesson.title,
          description: typeof description === 'string' ? description : lesson.description,
          order: Number(order) || lesson.order,
        },
      });

      // Xác định các block hiện có/được gửi lên
      const incomingIds = blocks.filter((b) => b && b.id).map((b) => Number(b.id));
      const toDelete = lesson.blocks
        .filter((b) => !incomingIds.includes(b.id))
        .map((b) => b.id);

      if (toDelete.length) {
        await tx.lessonBlock.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Upsert từng block
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
          await tx.lessonBlock.update({
            where: { id: Number(b.id) },
            data: payload,
          });
        } else {
          await tx.lessonBlock.create({
            data: { lessonId: id, ...payload },
          });
        }
      }
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
}
