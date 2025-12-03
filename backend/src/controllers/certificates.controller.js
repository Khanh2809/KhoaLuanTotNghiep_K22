import { prisma } from '../lib/db.js';

function ensureIssuer(req, course) {
  const role = req.user?.role;
  const userId = Number(req.user?.id);
  if (!userId) throw Object.assign(new Error('Unauthenticated'), { status: 401 });
  if (role === 'admin') return;
  if (role === 'instructor' && course?.instructorId === userId) return;
  throw Object.assign(new Error('Forbidden'), { status: 403 });
}

export async function issueCertificate(req, res) {
  try {
    const { userId, courseId, score, templateName, expiresAt } = req.body || {};
    if (!userId || !courseId) {
      return res.status(400).json({ error: 'userId và courseId là bắt buộc' });
    }
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      select: { id: true, instructorId: true, title: true },
    });
    if (!course) return res.status(404).json({ error: 'Khoá học không tồn tại' });
    ensureIssuer(req, course);

    const certificate = await prisma.certificate.create({
      data: {
        userId: Number(userId),
        courseId: Number(courseId),
        score: typeof score === 'number' ? score : Number(score) || null,
        templateName: templateName || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        issuedById: Number(req.user?.id) || null,
      },
    });

    // Clear pending requests for this user/course
    await prisma.alert.deleteMany({
      where: {
        courseId: Number(courseId),
        type: 'CERT_REQUEST',
        message: { contains: `userId=${userId}` },
      },
    });

    return res.json({ ok: true, certificate });
  } catch (err) {
    const status = err?.status || 500;
    console.error('Issue certificate failed', err);
    return res.status(status).json({ error: err?.message || 'Issue certificate failed' });
  }
}

function computeQuizAverageNormalized(quizzes, submissions) {
  if (!quizzes.length) return 0;
  const totalMap = new Map();
  quizzes.forEach((q) => {
    const total = q.questions.reduce((s, qq) => s + (qq.points ?? 1), 0) || q.questions.length || 1;
    totalMap.set(q.id, total);
  });

  const bestByQuiz = new Map();
  submissions.forEach((sub) => {
    const total = totalMap.get(sub.quizId) || 1;
    const score = typeof sub.score === 'number' ? sub.score : Number(sub.score) || 0;
    const pct = Math.max(0, Math.min(1, score / total));
    const prev = bestByQuiz.get(sub.quizId);
    if (!prev || pct > prev) bestByQuiz.set(sub.quizId, pct);
  });

  // Tính trung bình trên tổng số quiz của khóa (quiz chưa làm = 0)
  const sum = quizzes.reduce((acc, q) => acc + (bestByQuiz.get(q.id) ?? 0), 0);
  return sum / quizzes.length;
}

export async function requestCertificate(req, res) {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const courseId = Number(req.body?.courseId);
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true, title: true },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Avoid duplicate certs
    const existing = await prisma.certificate.findFirst({ where: { userId, courseId } });
    if (existing) return res.json({ ok: true, alreadyIssued: true, certificateId: existing.id });

    const lessons = await prisma.lesson.findMany({
      where: { module: { courseId } },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);
    const completed = lessonIds.length
      ? await prisma.userProgress.count({ where: { userId, lessonId: { in: lessonIds }, isCompleted: true } })
      : 0;
    const completionRate = lessonIds.length > 0 ? completed / lessonIds.length : 0;

    const quizzes = await prisma.quiz.findMany({
      where: { lesson: { module: { courseId } } },
      select: { id: true, questions: { select: { points: true } } },
    });
    const submissions = quizzes.length
      ? await prisma.submission.findMany({
          where: { userId, quizId: { in: quizzes.map((q) => q.id) }, score: { not: null } },
          select: { quizId: true, score: true },
        })
      : [];
    const avgQuizNormalized = computeQuizAverageNormalized(quizzes, submissions);

    if (completionRate < 1 || avgQuizNormalized <= 0.45) {
      return res.status(400).json({ error: 'Chua du dieu kien xin cap chung chi' });
    }

    // Avoid duplicate pending requests (till instructor handles)
    const existingRequest = await prisma.alert.findFirst({
      where: {
        courseId,
        type: 'CERT_REQUEST',
        message: { contains: `userId=${userId}` },
      },
    });
    if (existingRequest) {
      return res.status(409).json({ error: 'Yeu cau cua ban dang duoc xu ly' });
    }

    const autoIssue = avgQuizNormalized >= 0.9;
    if (autoIssue) {
      const cert = await prisma.certificate.create({
        data: {
          userId,
          courseId,
          score: Math.round(avgQuizNormalized * 100),
          templateName: 'default',
          issuedById: course.instructorId || null,
        },
      });
      return res.json({ ok: true, autoIssued: true, certificateId: cert.id });
    }

    // Create an alert to instructor to approve
    if (course.instructorId) {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      await prisma.alert.create({
        data: {
          courseId,
          userId: course.instructorId,
          type: 'CERT_REQUEST',
          severity: 'info',
          message: `Yeu cau cap chung chi - userId=${userId}`,
          targetUrl: `/instructor/courses/${courseId}`,
        },
      });
    }

    return res.json({ ok: true, pendingApproval: true });
  } catch (err) {
    console.error('Request certificate failed', err);
    return res.status(500).json({ error: 'Failed to request certificate' });
  }
}

export async function getCertificateStatus(req, res) {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const courseId = Number(req.query?.courseId);
    if (!courseId) return res.status(400).json({ error: 'courseId is required' });

    const cert = await prisma.certificate.findFirst({
      where: { userId, courseId },
      select: { id: true },
    });
    if (cert) return res.json({ issued: true, certificateId: cert.id, pending: false });

    const pending = await prisma.alert.findFirst({
      where: {
        courseId,
        type: 'CERT_REQUEST',
        message: { contains: `userId=${userId}` },
      },
      select: { id: true },
    });

    return res.json({ issued: false, pending: !!pending });
  } catch (err) {
    console.error('Get certificate status failed', err);
    return res.status(500).json({ error: 'Failed to get certificate status' });
  }
}

export async function listCertificates(req, res) {
  try {
    const { userId, courseId } = req.query;
    const requesterId = Number(req.user?.id);
    const requesterRole = req.user?.role;

    // Only admin/instructor can query other users. Default: current user only.
    const targetUserId =
      userId && (requesterRole === 'admin' || requesterRole === 'instructor')
        ? Number(userId)
        : requesterId;

    const rows = await prisma.certificate.findMany({
      where: {
        userId: targetUserId || undefined,
        courseId: courseId ? Number(courseId) : undefined,
      },
      orderBy: { issueDate: 'desc' },
      select: {
        id: true,
        issueDate: true,
        certificateUrl: true,
        verificationCode: true,
        expiresAt: true,
        score: true,
        templateName: true,
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return res.json(rows);
  } catch (err) {
    console.error('List certificates failed', err);
    return res.status(500).json({ error: 'Failed to load certificates' });
  }
}

export async function verifyCertificate(req, res) {
  try {
    const code = req.params.code;
    if (!code) return res.status(400).json({ error: 'Mã xác thực không hợp lệ' });
    const row = await prisma.certificate.findUnique({
      where: { verificationCode: code },
      select: {
        id: true,
        issueDate: true,
        expiresAt: true,
        certificateUrl: true,
        score: true,
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
        issuedBy: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
      },
    });
    if (!row) return res.status(404).json({ error: 'Certificate not found' });
    return res.json({ valid: true, certificate: row });
  } catch (err) {
    console.error('Verify certificate failed', err);
    return res.status(500).json({ error: 'Failed to verify certificate' });
  }
}
