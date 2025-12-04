import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db.js';

function ensureInstructorOrAdmin(req) {
  const role = req.user?.role;
  if (role === 'admin' || role === 'instructor') return;
  throw Object.assign(new Error('Forbidden'), { status: 403 });
}

function normalizeSlug(title, slug) {
  const base = (slug || title || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `path-${Date.now()}`;
}

// Đọc token nếu có (không bắt buộc) để xác định user hiện tại
function getOptionalUserId(req) {
  if (req.user?.id) return Number(req.user.id);
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return Number(payload?.id) || null;
  } catch {
    return null;
  }
}

export async function listPaths(req, res) {
  try {
    const canSeeDraft = req.user?.role === 'admin' || req.user?.role === 'instructor';
    const rows = await prisma.learningPath.findMany({
      where: canSeeDraft ? {} : { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { course: { select: { id: true, title: true, slug: true, status: true } } },
        },
        enrollments: { select: { id: true } },
      },
    });
    return res.json(
      rows.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        isPublished: p.isPublished,
        courseCount: p.items.length,
        enrollmentCount: p.enrollments.length,
        items: p.items,
      }))
    );
  } catch (err) {
    console.error('List learning paths failed', err);
    return res.status(500).json({ error: 'Failed to list learning paths' });
  }
}

export async function getPathDetail(req, res) {
  try {
    const currentUserId = getOptionalUserId(req);
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid path id' });
    const row = await prisma.learningPath.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                coursePrerequisites: { select: { prerequisiteCourseId: true } },
              },
            },
          },
        },
        enrollments: { select: { userId: true } },
      },
    });
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (!row.isPublished && !(req.user?.role === 'admin' || req.user?.role === 'instructor')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const enrolled = !!row.enrollments?.some((e) => e.userId === currentUserId);
    return res.json({ ...row, enrolled, currentUserId });
  } catch (err) {
    console.error('Get learning path failed', err);
    return res.status(500).json({ error: 'Failed to load learning path' });
  }
}

export async function createPath(req, res) {
  try {
    ensureInstructorOrAdmin(req);
    const { title, description, slug, courseIds, isPublished } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title la bat buoc' });
    const normalizedSlug = normalizeSlug(title, slug);
    const uniqueSlug = `${normalizedSlug}-${Date.now()}`;

    const courseList = Array.isArray(courseIds) ? courseIds : [];
    const items = courseList.map((cid, idx) => ({
      courseId: Number(cid),
      order: idx + 1,
    }));

    const path = await prisma.learningPath.create({
      data: {
        title,
        description: description || null,
        slug: uniqueSlug,
        isPublished: Boolean(isPublished),
        createdById: Number(req.user?.id) || null,
        items: { create: items },
      },
      include: { items: true },
    });
    return res.status(201).json({ ok: true, path });
  } catch (err) {
    const status = err?.status || 500;
    console.error('Create learning path failed', err);
    return res.status(status).json({ error: err?.message || 'Failed to create learning path' });
  }
}

export async function enrollPath(req, res) {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const pathId = Number(req.params.pathId);
    if (!pathId) return res.status(400).json({ error: 'Invalid pathId' });

    const path = await prisma.learningPath.findUnique({ where: { id: pathId }, select: { isPublished: true } });
    if (!path) return res.status(404).json({ error: 'Learning path khong ton tai' });
    if (!path.isPublished && !(req.user?.role === 'admin' || req.user?.role === 'instructor')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const enrollment = await prisma.learningPathEnrollment.upsert({
      where: { pathId_userId: { pathId, userId } },
      update: { status: 'ACTIVE' },
      create: { pathId, userId, status: 'ACTIVE' },
    });
    return res.json({ ok: true, enrollment });
  } catch (err) {
    console.error('Enroll learning path failed', err);
    return res.status(500).json({ error: 'Failed to enroll learning path' });
  }
}

export async function publishPath(req, res) {
  try {
    ensureInstructorOrAdmin(req);
    const pathId = Number(req.params.pathId);
    if (!pathId) return res.status(400).json({ error: 'Invalid pathId' });
    const updated = await prisma.learningPath.update({
      where: { id: pathId },
      data: { isPublished: true },
    });
    return res.json({ ok: true, path: updated });
  } catch (err) {
    const status = err?.status || 500;
    console.error('Publish learning path failed', err);
    return res.status(status).json({ error: err?.message || 'Failed to publish learning path' });
  }
}
