import { prisma } from '../lib/db.js';
import { mailer } from '../lib/mailer.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function canSendMail() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendReminderEmails() {
  const cutoff = new Date(Date.now() - 3 * ONE_DAY_MS);
  const recent = await prisma.activityLog.findMany({
    where: { createdAt: { gte: cutoff }, eventType: { in: ['LESSON_OPEN', 'QUIZ_START', 'LOGIN'] } },
    select: { userId: true },
  });
  const activeIds = new Set(recent.map((r) => r.userId));

  const whereClause = activeIds.size ? { userId: { notIn: Array.from(activeIds) }, user: { email: { not: null } } } : { user: { email: { not: null } } };
  const enrollments = await prisma.enrollment.findMany({
    where: whereClause,
    select: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
    take: 50,
  });

  const grouped = new Map();
  enrollments.forEach((row) => {
    if (!row.user?.email) return;
    const entry = grouped.get(row.user.email) || { user: row.user, courses: [] };
    entry.courses.push(row.course?.title);
    grouped.set(row.user.email, entry);
  });

  for (const [, data] of grouped) {
    const subject = 'Nhắc học: quay lại lộ trình của bạn';
    const courseList = data.courses.filter(Boolean).slice(0, 5).join(', ');
    const text =
      `Chào ${data.user.name || 'bạn'},\n` +
      `Bạn chưa có hoạt động mới 3 ngày qua. Hãy tiếp tục học: ${courseList || 'khóa học của bạn'}.\n`;
    if (!canSendMail()) {
      console.log('[jobs] (dry-run) would send reminder to', data.user.email, 'courses:', courseList);
      continue;
    }
    try {
      await mailer.sendMail({
        to: data.user.email,
        subject,
        text,
      });
    } catch (err) {
      console.error('Send reminder failed', err);
    }
  }
}

async function sendWeeklyReports() {
  const since = new Date(Date.now() - 7 * ONE_DAY_MS);
  const courses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      instructor: { select: { id: true, name: true, email: true } },
    },
  });

  for (const course of courses) {
    if (!course.instructor?.email) continue;
    const [enrollCount, recentActivity, submissions] = await Promise.all([
      prisma.enrollment.count({ where: { courseId: course.id } }),
      prisma.activityLog.count({ where: { courseId: course.id, createdAt: { gte: since } } }),
      prisma.submission.count({ where: { quiz: { lesson: { module: { courseId: course.id } } }, submittedAt: { gte: since } } }),
    ]);
    const subject = `Báo cáo tuần - ${course.title}`;
    const text =
      `Tổng học viên: ${enrollCount}\n` +
      `Hoạt động 7 ngày qua: ${recentActivity}\n` +
      `Bài quiz đã nộp 7 ngày qua: ${submissions}\n`;
    if (!canSendMail()) {
      console.log('[jobs] (dry-run) weekly report ->', course.instructor.email, course.title);
      continue;
    }
    try {
      await mailer.sendMail({
        to: course.instructor.email,
        subject,
        text,
      });
    } catch (err) {
      console.error('Send weekly report failed', err);
    }
  }
}

async function processPendingMedia() {
  const blocks = await prisma.lessonBlock.findMany({
    where: { blockType: 'VIDEO', caption: null },
    select: { id: true, lessonId: true, videoUrl: true },
    take: 30,
  });
  if (!blocks.length) {
    console.log('[jobs] No video blocks waiting for processing');
    return;
  }
  // Placeholder: log jobs; integration with real transcoder can be wired here.
  console.log('[jobs] Found video blocks to process:', blocks.map((b) => b.id));
}

export function startSchedulers() {
  if (process.env.ENABLE_JOBS !== 'true') {
    console.log('[jobs] Background jobs disabled (set ENABLE_JOBS=true to enable)');
    return;
  }
  console.log('[jobs] Background jobs enabled');
  const reminderEvery = Number(process.env.JOB_REMINDER_MINUTES || 60) * 60 * 1000;
  const reportEvery = Number(process.env.JOB_REPORT_MINUTES || 6 * 60) * 60 * 1000;
  const mediaEvery = Number(process.env.JOB_MEDIA_MINUTES || 30) * 60 * 1000;

  setInterval(sendReminderEmails, reminderEvery);
  setInterval(sendWeeklyReports, reportEvery);
  setInterval(processPendingMedia, mediaEvery);

  // Fire once on boot so có dữ liệu ngay.
  sendReminderEmails().catch((e) => console.error('Reminder job error', e));
  sendWeeklyReports().catch((e) => console.error('Weekly job error', e));
  processPendingMedia().catch((e) => console.error('Media job error', e));
}
