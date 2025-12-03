import { prisma } from '../lib/db.js';
import { openrouterChat } from '../lib/llm/openrouter.client.js';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseCourseId(raw) {
  const courseId = Number(raw);
  if (!courseId || Number.isNaN(courseId)) {
    throw new HttpError(400, 'Invalid courseId');
  }
  return courseId;
}

async function authorizeCourseAccess(courseId, req) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, instructorId: true, title: true },
  });
  if (!course) throw new HttpError(404, 'Course not found');

  const requesterId = Number(req.user?.id);
  const requesterRole = req.user?.role;
  if (requesterRole === 'admin') return course;

  let authorized = false;
  if (requesterRole === 'instructor' && requesterId === course.instructorId) {
    authorized = true;
  } else if (requesterId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, userId: requesterId },
      select: { id: true },
    });
    authorized = !!enrollment;
  }
  if (!authorized) throw new HttpError(403, 'Forbidden');
  return course;
}

async function computeCoursePerformance(courseId) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true },
  });
  const learnerIds = enrollments.map((e) => e.userId);

  const [totalLessons, completedLessonRows, quizzes, submissions] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    learnerIds.length
      ? prisma.userProgress.findMany({
          where: { isCompleted: true, lesson: { module: { courseId } }, userId: { in: learnerIds } },
          select: { lessonId: true, userId: true },
          distinct: ['lessonId', 'userId'],
        })
      : [],
    prisma.quiz.findMany({
      where: { lesson: { module: { courseId } } },
      select: { id: true, title: true, deadline: true, questions: { select: { points: true } } },
    }),
    prisma.submission.findMany({
      where: { quiz: { lesson: { module: { courseId } } }, submittedAt: { not: null }, score: { not: null } },
      select: { quizId: true, score: true, submittedAt: true, userId: true },
      orderBy: { submittedAt: 'desc' },
    }),
  ]);

  const completedLessons = completedLessonRows.length;
  let completionRate = null;
  if (totalLessons > 0 && learnerIds.length > 0) {
    const completedByUser = new Map();
    completedLessonRows.forEach((row) => {
      completedByUser.set(row.userId, (completedByUser.get(row.userId) || 0) + 1);
    });
    const totalCompletedLessons = Array.from(completedByUser.values()).reduce((sum, v) => sum + v, 0);
    completionRate = totalCompletedLessons / (totalLessons * learnerIds.length);
  }

  const quizMeta = new Map();
  quizzes.forEach((quiz) => {
    const totalPoints =
      quiz.questions.reduce((sum, question) => sum + (question.points ?? 1), 0) ||
      quiz.questions.length ||
      1;
    quizMeta.set(quiz.id, {
      title: quiz.title,
      totalPoints,
      deadline: quiz.deadline ? new Date(quiz.deadline) : null,
    });
  });

  let normalizedSum = 0;
  let participantCount = 0;
  const perQuizMap = new Map();
  let submissionsWithDeadline = 0;
  let onTimeSubmissions = 0;

  const bestScoreByUserQuiz = new Map();
  const firstSubmissionByUserQuiz = new Map();

  submissions.forEach((submission) => {
    const meta = quizMeta.get(submission.quizId);
    if (!meta || !meta.totalPoints) return;
    const scoreValue = typeof submission.score === 'number' ? submission.score : Number(submission.score) || 0;
    const normalized = Math.max(0, Math.min(1, scoreValue / meta.totalPoints));

    const key = `${submission.userId}:${submission.quizId}`;
    const prevBest = bestScoreByUserQuiz.get(key);
    if (!prevBest || normalized > prevBest) {
      bestScoreByUserQuiz.set(key, normalized);
    }
    const prevFirst = firstSubmissionByUserQuiz.get(key);
    if (!prevFirst || (submission.submittedAt && submission.submittedAt < prevFirst)) {
      firstSubmissionByUserQuiz.set(key, submission.submittedAt);
    }
  });

  bestScoreByUserQuiz.forEach((normalized, key) => {
    const [, quizIdRaw] = key.split(':');
    const quizId = Number(quizIdRaw);
    const meta = quizMeta.get(quizId);
    if (!meta) return;

    normalizedSum += normalized;
    participantCount += 1;

    const existing =
      perQuizMap.get(quizId) ?? { quizId, quizTitle: meta.title, participants: 0, normalizedSum: 0 };
    existing.participants += 1;
    existing.normalizedSum += normalized;
    perQuizMap.set(quizId, existing);
  });

  firstSubmissionByUserQuiz.forEach((submittedAt, key) => {
    const [, quizIdRaw] = key.split(':');
    const quizId = Number(quizIdRaw);
    const meta = quizMeta.get(quizId);
    if (!meta?.deadline || !submittedAt) return;
    submissionsWithDeadline += 1;
    if (submittedAt < meta.deadline) onTimeSubmissions += 1;
  });

  const perQuizAverage = Array.from(perQuizMap.values())
    .map((row) => ({
      quizId: row.quizId,
      quizTitle: row.quizTitle,
      participants: row.participants,
      attempts: row.participants, // backward-compatible key
      averageScore: row.participants ? row.normalizedSum / row.participants : 0,
    }))
    .sort((a, b) => a.quizId - b.quizId);

  const onTimeSubmissionRate =
    submissionsWithDeadline > 0 ? onTimeSubmissions / submissionsWithDeadline : null;

  return {
    completion: { completionRate, completedLessons, totalLessons, learnerCount: learnerIds.length },
    averageQuizScore: {
      averageScore: participantCount > 0 ? normalizedSum / participantCount : null,
      quizCount: quizzes.length,
      participants: participantCount,
      attempts: participantCount, // backward-compatible key
      perQuizAverage,
    },
    onTimeSubmissionRate,
  };
}

const DEFAULT_WINDOW_DAYS = 30;
const RECENT_DAYS = 7;

async function computeCourseEngagement(courseId, lookbackDays = DEFAULT_WINDOW_DAYS) {
  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - (lookbackDays - 1));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - (RECENT_DAYS - 1));

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true },
  });
  const userIds = new Set(enrollments.map((e) => e.userId));
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (course?.instructorId) userIds.add(course.instructorId);

  const studyEvents = await prisma.activityLog.findMany({
    where: {
      courseId,
      userId: { in: Array.from(userIds) },
      eventType: { in: ['LESSON_OPEN', 'TAB_OUT', 'IDLE'] },
      createdAt: { gte: windowStart },
    },
    select: { userId: true, eventType: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const loginEvents = userIds.size
    ? await prisma.activityLog.findMany({
        where: { userId: { in: Array.from(userIds) }, eventType: 'LOGIN', createdAt: { gte: windowStart } },
        select: { userId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const dayKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  };

  const perDayMinutes = new Map();
  const lastStartByUser = new Map();

  studyEvents.forEach((ev) => {
    const ts = new Date(ev.createdAt);
    if (ev.eventType === 'LESSON_OPEN') {
      lastStartByUser.set(ev.userId, ts);
    } else if ((ev.eventType === 'TAB_OUT' || ev.eventType === 'IDLE') && lastStartByUser.has(ev.userId)) {
      const start = lastStartByUser.get(ev.userId);
      const diffMinutes = Math.max(0, (ts.getTime() - start.getTime()) / 60000);
      const key = dayKey(start);
      perDayMinutes.set(key, (perDayMinutes.get(key) || 0) + diffMinutes);
      lastStartByUser.delete(ev.userId);
    }
  });

  const studyMinutesPerDay = Array.from(perDayMinutes.entries())
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const loginsByUser = new Map();
  loginEvents.forEach((ev) => {
    const arr = loginsByUser.get(ev.userId) || [];
    arr.push(ev.createdAt);
    loginsByUser.set(ev.userId, arr.slice(0, 10)); // keep recent 10
  });

  const totalMinutesLast7Days = studyMinutesPerDay
    .filter((row) => new Date(row.date) >= sevenDaysAgo)
    .reduce((sum, row) => sum + row.minutes, 0);
  const averageStudyMinutesLast7Days = totalMinutesLast7Days / RECENT_DAYS;

  const loginsPerDayMap = new Map();
  loginEvents.forEach((ev) => {
    const key = dayKey(ev.createdAt);
    loginsPerDayMap.set(key, (loginsPerDayMap.get(key) || 0) + 1);
  });

  const loginsPerDay = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    loginsPerDay.push({ date: key, count: loginsPerDayMap.get(key) || 0 });
  }
  const loginsLast7Days = loginsPerDay.reduce((sum, row) => sum + row.count, 0);

  return {
    studyMinutesPerDay,
    averageStudyMinutesLast7Days,
    loginsLast7Days,
    loginsPerDay,
    loginsByUser: Array.from(loginsByUser.entries()).map(([userId, times]) => ({
      userId,
      logins: times,
    })),
    windowDays: lookbackDays,
  };
}

async function computeCourseBehavior(courseId, lookbackDays = DEFAULT_WINDOW_DAYS) {
  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - (lookbackDays - 1));

  const activeEvents = await prisma.activityLog.findMany({
    where: { courseId, eventType: { in: ['LESSON_OPEN', 'QUIZ_START'] }, createdAt: { gte: windowStart } },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const tabOutCount = await prisma.activityLog.count({
    where: { courseId, eventType: 'TAB_OUT', createdAt: { gte: windowStart } },
  });

  if (activeEvents.length === 0) {
    return { inactiveDays: lookbackDays, tabOutCount, pattern: 'no_activity_window', windowDays: lookbackDays };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const toDayStart = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const today = toDayStart(new Date());
  const activeDaySet = new Set(activeEvents.map((ev) => toDayStart(ev.createdAt).getTime()));
  const daysSorted = Array.from(activeDaySet.values()).sort((a, b) => a - b);
  const totalDays = Math.floor((today.getTime() - windowStart.getTime()) / dayMs) + 1;
  const lastActiveTs = daysSorted[daysSorted.length - 1];
  // Inactive days tính từ lần hoạt động gần nhất đến hôm nay (đỡ phồng lên do thiếu log đầu cửa sổ)
  const inactiveDays = Math.max(
    0,
    Math.floor((today.getTime() - lastActiveTs) / dayMs)
  );

  let longestGap = 0;
  for (let i = 1; i < daysSorted.length; i++) {
    const gap = (daysSorted[i] - daysSorted[i - 1]) / dayMs - 1;
    if (gap > longestGap) longestGap = gap;
  }
  const tailGap = (today.getTime() - daysSorted[daysSorted.length - 1]) / dayMs;
  if (tailGap > longestGap) longestGap = tailGap;

  const dayCounts = new Map();
  activeEvents.forEach((ev) => {
    const key = toDayStart(ev.createdAt).getTime();
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  });
  const totalLogs = activeEvents.length;
  const busiest = Array.from(dayCounts.values()).sort((a, b) => b - a);
  const top2Share = busiest.length === 0 ? 0 : (busiest[0] + (busiest[1] || 0)) / totalLogs;

  let pattern = 'mixed';
  if (activeDaySet.size === totalDays) pattern = 'consistent';
  else if (longestGap >= 3) pattern = 'interrupted';
  else if (top2Share >= 0.6) pattern = 'burst_learning';

  return { inactiveDays, tabOutCount, pattern, windowDays: lookbackDays };
}

async function computePerUserStats(courseId, lookbackDays = DEFAULT_WINDOW_DAYS) {
  const windowStart = new Date();
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - (lookbackDays - 1));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - (RECENT_DAYS - 1));

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true, user: { select: { id: true, name: true, email: true } } },
  });
  const users = enrollments.map((e) => e.user).filter(Boolean);
  if (!users.length) return [];
  const userIds = users.map((u) => u.id);

  const studyEvents = await prisma.activityLog.findMany({
    where: {
      courseId,
      userId: { in: userIds },
      eventType: { in: ['LESSON_OPEN', 'TAB_OUT', 'IDLE'] },
      createdAt: { gte: windowStart },
    },
    select: { userId: true, eventType: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const activeEvents = await prisma.activityLog.findMany({
    where: { courseId, userId: { in: userIds }, eventType: { in: ['LESSON_OPEN', 'QUIZ_START'] }, createdAt: { gte: windowStart } },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const tabOutCounts = await prisma.activityLog.groupBy({
    by: ['userId'],
    where: { courseId, eventType: 'TAB_OUT', userId: { in: userIds }, createdAt: { gte: windowStart } },
    _count: { _all: true },
  });
  const tabOutMap = new Map(tabOutCounts.map((r) => [r.userId, r._count._all]));

  const perUserMinutes = new Map();
  const lastStartByUser = new Map();
  const perUserMinutesLast7 = new Map();
  const lastStartByUserLast7 = new Map();

  studyEvents.forEach((ev) => {
    const ts = new Date(ev.createdAt);
    if (ev.eventType === 'LESSON_OPEN') {
      lastStartByUser.set(ev.userId, ts);
      if (ts >= sevenDaysAgo) {
        lastStartByUserLast7.set(ev.userId, ts);
      }
    } else if ((ev.eventType === 'TAB_OUT' || ev.eventType === 'IDLE') && lastStartByUser.has(ev.userId)) {
      const start = lastStartByUser.get(ev.userId);
      const diffMinutes = Math.max(0, (ts.getTime() - start.getTime()) / 60000);
      perUserMinutes.set(ev.userId, (perUserMinutes.get(ev.userId) || 0) + diffMinutes);
      lastStartByUser.delete(ev.userId);
      const start7 = lastStartByUserLast7.get(ev.userId);
      if (start7) {
        const diff7 = Math.max(0, (ts.getTime() - start7.getTime()) / 60000);
        perUserMinutesLast7.set(ev.userId, (perUserMinutesLast7.get(ev.userId) || 0) + diff7);
        lastStartByUserLast7.delete(ev.userId);
      }
    }
  });

  const perUserInactive = new Map();
  const dayMs = 24 * 60 * 60 * 1000;
  const toDayStart = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const today = toDayStart(new Date());

  const eventsByUser = new Map();
  activeEvents.forEach((ev) => {
    const arr = eventsByUser.get(ev.userId) || [];
    arr.push(ev);
    eventsByUser.set(ev.userId, arr);
  });

  for (const user of users) {
    const evs = eventsByUser.get(user.id) || [];
    if (!evs.length) {
      perUserInactive.set(user.id, null);
      continue;
    }
    const activeDaySet = new Set(evs.map((ev) => toDayStart(ev.createdAt).getTime()));
    const daysSorted = Array.from(activeDaySet.values()).sort((a, b) => a - b);
    const totalDays = Math.floor((today.getTime() - windowStart.getTime()) / dayMs) + 1;
    const lastActiveTs = daysSorted[daysSorted.length - 1];
    const inactiveDays = Math.max(
      0,
      Math.floor((today.getTime() - lastActiveTs) / dayMs)
    );
    perUserInactive.set(user.id, inactiveDays);
  }

  return users.map((u) => {
    const minutes = perUserMinutes.get(u.id) || 0;
    const minutesLast7 = perUserMinutesLast7.get(u.id) || 0;
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      studyMinutesTotal: Math.round(minutes),
      studyMinutesLast7Days: Math.round(minutesLast7),
      tabOutCount: tabOutMap.get(u.id) || 0,
      inactiveDays: perUserInactive.get(u.id),
      windowDays: lookbackDays,
    };
  });
}

async function computeUserQuizStats(courseId) {
  const quizzes = await prisma.quiz.findMany({
    where: { lesson: { module: { courseId } } },
    select: { id: true, questions: { select: { points: true } } },
  });
  const totalMap = new Map();
  quizzes.forEach((q) => {
    const total = q.questions.reduce((s, qq) => s + (qq.points ?? 1), 0) || q.questions.length || 1;
    totalMap.set(q.id, total);
  });

  const submissions = await prisma.submission.findMany({
    where: { quiz: { lesson: { module: { courseId } } }, score: { not: null } },
    select: { userId: true, quizId: true, score: true },
  });

  const bestByUserQuiz = new Map();
  submissions.forEach((sub) => {
    const total = totalMap.get(sub.quizId) || 1;
    const normalized = Math.max(0, Math.min(1, (Number(sub.score) || 0) / total));
    const key = `${sub.userId}:${sub.quizId}`;
    const prev = bestByUserQuiz.get(key);
    if (!prev || normalized > prev) {
      bestByUserQuiz.set(key, normalized);
    }
  });

  const result = new Map();
  bestByUserQuiz.forEach((normalized, key) => {
    const [userIdRaw] = key.split(':');
    const userId = Number(userIdRaw);
    const cur = result.get(userId) || { attempts: 0, sum: 0 };
    cur.attempts += 1;
    cur.sum += normalized;
    result.set(userId, cur);
  });

  result.forEach((val, userId) => {
    result.set(userId, { attempts: val.attempts, avgScore: val.sum / val.attempts });
  });
  return result;
}

async function computeUserCompletions(courseId) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true, user: { select: { id: true, name: true, email: true } } },
  });
  const users = enrollments.map((e) => e.user).filter(Boolean);
  if (!users.length) return [];

  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId } },
    select: { id: true },
  });
  const lessonIds = lessons.map((l) => l.id);

  const progress = await prisma.userProgress.findMany({
    where: { lessonId: { in: lessonIds }, userId: { in: users.map((u) => u.id) }, isCompleted: true },
    select: { userId: true, lessonId: true },
  });

  const completedByUser = new Map();
  progress.forEach((p) => {
    completedByUser.set(p.userId, (completedByUser.get(p.userId) || 0) + 1);
  });

  return users.map((u) => {
    const completed = completedByUser.get(u.id) || 0;
    const total = lessonIds.length;
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      completedLessons: completed,
      totalLessons: total,
      completionRate: total > 0 ? completed / total : 0,
    };
  });
}

async function computePerQuizScores(courseId) {
  const quizzes = await prisma.quiz.findMany({
    where: { lesson: { module: { courseId } } },
    select: { id: true, title: true, questions: { select: { points: true } } },
  });
  const totals = new Map();
  quizzes.forEach((q) => {
    const total = q.questions.reduce((s, qq) => s + (qq.points ?? 1), 0) || q.questions.length || 1;
    totals.set(q.id, total);
  });

  const submissions = await prisma.submission.findMany({
    where: { quiz: { lesson: { module: { courseId } } }, score: { not: null } },
    select: { quizId: true, score: true, user: { select: { id: true, name: true, email: true } } },
  });

  const perQuiz = new Map();
  submissions.forEach((s) => {
    const total = totals.get(s.quizId) || 1;
    const scorePct = Math.max(0, Math.min(1, (Number(s.score) || 0) / total));
    const cur = perQuiz.get(s.quizId) || { quizId: s.quizId, quizTitle: '', scores: [] };
    cur.scores.push({
      userId: s.user?.id,
      name: s.user?.name,
      email: s.user?.email,
      scorePct,
    });
    perQuiz.set(s.quizId, cur);
  });

  quizzes.forEach((q) => {
    const cur = perQuiz.get(q.id) || { quizId: q.id, quizTitle: q.title, scores: [] };
    cur.quizTitle = q.title;
    perQuiz.set(q.id, cur);
  });

  return Array.from(perQuiz.values());
}

function classifyLearner({ minutes, tabOut, inactiveDays, avgScore, attempts }) {
  const score = avgScore ?? 0;
  if (!attempts) {
    if (!minutes || minutes < 5) return { label: 'Chua bat dau', reason: 'Chua co thoi gian hoc va bai nop', level: 'warning' };
    if (minutes < 30) return { label: 'Hoc luot', reason: 'It thoi gian hoc va chua lam quiz', level: 'warning' };
    return { label: 'Can lam quiz', reason: 'Chua co bai nop de danh gia', level: 'info' };
  }
  if (minutes < 20 && score >= 0.8 && tabOut > 5) {
    return { label: 'Co the gian lan', reason: 'Diem cao nhung thoi gian thap, tab-out nhieu', level: 'danger' };
  }
  if (minutes < 30 && score < 0.5) {
    return { label: 'Hoc luot', reason: 'Diem thap va thoi gian hoc it', level: 'warning' };
  }
  if (minutes >= 30 && score < 0.5) {
    return { label: 'Can on them', reason: 'Xem bai nhieu nhung diem quiz thap', level: 'info' };
  }
  if (score >= 0.8) {
    return { label: 'Hoc nghiem tuc', reason: 'Diem cao va thoi gian hoc on', level: 'success' };
  }
  return { label: 'Dang tien bo', reason: 'Da lam quiz, can luyen them de tang diem', level: 'info' };
}

function computeRiskLevel({ completionRate, avgScore, inactiveDays }) {
  const completion = completionRate ?? 0;
  const score = avgScore ?? 0;
  const inactivityPenalty = Math.min(1, Math.max(0, (inactiveDays ?? 0) / 7));
  const riskScore = 0.4 * (1 - completion) + 0.4 * (1 - score) + 0.2 * inactivityPenalty;
  let riskLevel = 'low';
  if (riskScore >= 0.66) riskLevel = 'high';
  else if (riskScore >= 0.33) riskLevel = 'medium';
  return { riskScore, riskLevel };
}

export async function getStudentCourseAnalytics(req, res) {
  try {
    const courseIdParam = req.params.courseId ?? req.query.courseId;
    const courseId = parseCourseId(courseIdParam);
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const course = await authorizeCourseAccess(courseId, req);

    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      select: { id: true, title: true, order: true, lessons: { select: { id: true, title: true, order: true } } },
      orderBy: { order: 'asc' },
    });

    const sortedModules = modules
      .map((m) => ({
        ...m,
        lessons: [...(m.lessons ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const lessonIds = sortedModules.flatMap((m) => m.lessons.map((ls) => ls.id));
    const progresses = lessonIds.length
      ? await prisma.userProgress.findMany({
          where: { userId, lessonId: { in: lessonIds } },
          select: { lessonId: true, isCompleted: true, lastAccessed: true },
        })
      : [];
    const completedSet = new Set(progresses.filter((p) => p.isCompleted).map((p) => p.lessonId));
    const lastAccessedAt = progresses.reduce((latest, row) => {
      const ts = row?.lastAccessed ? new Date(row.lastAccessed) : null;
      if (!ts || Number.isNaN(ts.getTime())) return latest;
      if (!latest) return ts;
      return ts > latest ? ts : latest;
    }, null);

    const nextLesson = (() => {
      for (const m of sortedModules) {
        for (const ls of m.lessons) {
          if (!completedSet.has(ls.id)) {
            return { id: ls.id, title: ls.title, moduleId: m.id };
          }
        }
      }
      return null;
    })();

    const moduleStats = sortedModules.map((m) => {
      const totalLessons = m.lessons.length;
      const completedLessons = m.lessons.filter((ls) => completedSet.has(ls.id)).length;
      return { moduleId: m.id, moduleTitle: m.title, completedLessons, totalLessons };
    });

    const totalLessons = moduleStats.reduce((sum, m) => sum + m.totalLessons, 0);
    const completedLessons = moduleStats.reduce((sum, m) => sum + m.completedLessons, 0);
    const userCompletionRate = totalLessons > 0 ? completedLessons / totalLessons : 0;

    const performance = await computeCoursePerformance(courseId);

    const quizzes = await prisma.quiz.findMany({
      where: { lesson: { module: { courseId } } },
      select: {
        id: true,
        title: true,
        lessonId: true,
        lesson: { select: { id: true, title: true } },
        questions: { select: { points: true } },
      },
    });
    const quizTotals = new Map();
    quizzes.forEach((q) => {
      const totalPoints = q.questions.reduce((sum, qq) => sum + (qq.points ?? 1), 0) || q.questions.length || 1;
      quizTotals.set(q.id, {
        totalPoints,
        title: q.title,
        lessonTitle: q.lesson?.title ?? null,
        lessonId: q.lessonId ?? q.lesson?.id ?? null,
      });
    });

    const submissions = quizzes.length
      ? await prisma.submission.findMany({
          where: { userId, quizId: { in: quizzes.map((q) => q.id) }, score: { not: null } },
          select: { quizId: true, score: true, submittedAt: true },
          orderBy: { submittedAt: 'desc' },
        })
      : [];

    const seenQuiz = new Set();
    const lowScoreRecommendations = [];
    let userScoreSum = 0;
    let userScoreCount = 0;
    submissions.forEach((sub) => {
      if (seenQuiz.has(sub.quizId)) return;
      seenQuiz.add(sub.quizId);
      const meta = quizTotals.get(sub.quizId);
      if (!meta || !meta.totalPoints) return;
      const score = typeof sub.score === 'number' ? sub.score : Number(sub.score) || 0;
      const pct = score / meta.totalPoints;
      userScoreSum += pct;
      userScoreCount += 1;
      if (pct < 0.5) {
        lowScoreRecommendations.push({
          quizId: sub.quizId,
          quizTitle: meta.title,
          lessonTitle: meta.lessonTitle,
          scorePct: pct,
        });
      }
    });
    const pendingQuizzes = quizzes.filter((q) => {
      const lessonId = q.lessonId ?? q.lesson?.id;
      if (!lessonId || !completedSet.has(lessonId)) return false;
      return !seenQuiz.has(q.id);
    }).length;

    const perUserStatsForCourse = await computePerUserStats(courseId);
    const userQuizStats = await computeUserQuizStats(courseId);
    const meStat = perUserStatsForCourse.find((u) => u.userId === userId);
    const myQuizStat = userQuizStats.get(userId) || { attempts: 0, avgScore: null };
    const insight = classifyLearner({
      minutes: meStat?.studyMinutesTotal ?? 0,
      tabOut: meStat?.tabOutCount ?? 0,
      inactiveDays: meStat?.inactiveDays ?? 0,
      avgScore: myQuizStat.avgScore,
      attempts: myQuizStat.attempts,
    });

    return res.json({
      courseId,
      userCompletion: {
        completionRate: userCompletionRate,
        completedLessons,
        totalLessons,
        modules: moduleStats,
        pendingQuizzes,
      },
      classBenchmark: {
        completionRate: performance?.completion?.completionRate ?? 0,
        averageQuizScore: performance?.averageQuizScore?.averageScore ?? null,
      },
      userQuizAverage: userScoreCount > 0 ? userScoreSum / userScoreCount : null,
      lowScoreRecommendations,
      nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title, moduleId: nextLesson.moduleId ?? null } : null,
      nextLessonTitle: nextLesson?.title ?? null,
      pendingQuizzes,
      completedLessonIds: Array.from(completedSet.values()),
      lastAccessedAt: lastAccessedAt ? lastAccessedAt.toISOString() : null,
      courseTitle: course?.title ?? undefined,
      insight,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
      console.error('Failed to load student course analytics', error);
      return res.status(500).json({ error: 'Failed to load student course analytics' });
    }
  }

export async function getStudentCourseSummary(req, res) {
  try {
    const courseIdParam = req.body?.courseId ?? req.query.courseId;
    const courseId = parseCourseId(courseIdParam);
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const course = await authorizeCourseAccess(courseId, req);

    // 1) Tiến độ theo module + toàn khóa của riêng học viên
    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        order: true,
        lessons: { select: { id: true, title: true, order: true } },
      },
      orderBy: { order: 'asc' },
    });

    const lessonIds = modules.flatMap((m) => m.lessons.map((ls) => ls.id));
    const progresses = lessonIds.length
      ? await prisma.userProgress.findMany({
          where: { userId, lessonId: { in: lessonIds } },
          select: { lessonId: true, isCompleted: true },
        })
      : [];
    const completedSet = new Set(progresses.filter((p) => p.isCompleted).map((p) => p.lessonId));

    const moduleStats = modules.map((m) => {
      const totalLessons = m.lessons.length;
      const completedLessons = m.lessons.filter((ls) => completedSet.has(ls.id)).length;
      return { moduleId: m.id, moduleTitle: m.title, completedLessons, totalLessons };
    });

    const totalLessons = moduleStats.reduce((sum, m) => sum + m.totalLessons, 0);
    const completedLessons = moduleStats.reduce((sum, m) => sum + m.completedLessons, 0);
    const userCompletionRate = totalLessons > 0 ? completedLessons / totalLessons : 0;

    // 2) Điểm quiz và các quiz yếu của học viên
    const quizzes = await prisma.quiz.findMany({
      where: { lesson: { module: { courseId } } },
      select: {
        id: true,
        title: true,
        lesson: { select: { title: true } },
        questions: { select: { points: true } },
      },
    });

    const quizTotals = new Map();
    quizzes.forEach((q) => {
      const totalPoints =
        q.questions.reduce((sum, qq) => sum + (qq.points ?? 1), 0) ||
        q.questions.length ||
        1;
      quizTotals.set(q.id, { totalPoints, title: q.title, lessonTitle: q.lesson?.title ?? null });
    });

    const submissions = quizzes.length
      ? await prisma.submission.findMany({
          where: { userId, quizId: { in: quizzes.map((q) => q.id) }, score: { not: null } },
          select: { quizId: true, score: true, submittedAt: true },
          orderBy: { submittedAt: 'desc' },
        })
      : [];

    const seenQuiz = new Set();
    const weakQuizzes = [];
    let userScoreSum = 0;
    let userScoreCount = 0;

    submissions.forEach((sub) => {
      if (seenQuiz.has(sub.quizId)) return;
      seenQuiz.add(sub.quizId);
      const meta = quizTotals.get(sub.quizId);
      if (!meta || !meta.totalPoints) return;

      const score = typeof sub.score === 'number' ? sub.score : Number(sub.score) || 0;
      const pct = score / meta.totalPoints;
      userScoreSum += pct;
      userScoreCount += 1;

      if (pct < 0.5) {
        weakQuizzes.push({
          quizId: sub.quizId,
          quizTitle: meta.title,
          lessonTitle: meta.lessonTitle,
          scorePct: pct,
        });
      }
    });

    const userQuizAverage = userScoreCount > 0 ? userScoreSum / userScoreCount : null;

    // 3) Hành vi học tập của riêng học viên trong khóa
    const perUserStatsForCourse = await computePerUserStats(courseId);
    const meStat = perUserStatsForCourse.find((u) => u.userId === userId);

    const minutesTotal = Math.round(meStat?.studyMinutesTotal ?? 0);
    const minutesLast7 = Math.round(meStat?.studyMinutesLast7Days ?? 0);
    const inactiveDays = meStat?.inactiveDays ?? null;
    const tabOutCount = meStat?.tabOutCount ?? null;

    const completionPct = Math.round(userCompletionRate * 100);
    const avgQuizPct = userQuizAverage !== null ? Math.round(userQuizAverage * 100) : null;
    const weakQuizCount = weakQuizzes.length;

    const messages = [
      {
        role: 'system',
        content:
          'Bạn là trợ lý phân tích học tập cá nhân. Trả lời tiếng Việt, ngắn gọn (80-150 từ), giọng nói tích cực nhưng thẳng thắn. ' +
          'Tập trung vào tiến độ và điểm số của HỌC VIÊN NÀY, không nói về các bạn khác hay trung bình lớp. ' +
          'Dạng Markdown với các mục: **Tổng quan**, **Điểm mạnh**, **Cần cải thiện**, **Gợi ý hành động** (1-3 bullet).',
      },
      {
        role: 'user',
        content:
          `Dữ liệu của học viên trong khóa "${course.title}":\n` +
          `- Tiến độ cá nhân: ${completionPct}% (${completedLessons}/${totalLessons} bài).\n` +
          `- Điểm quiz trung bình: ${avgQuizPct ?? 'N/A'}%.\n` +
          `- Số quiz dưới 50%: ${weakQuizCount}.\n` +
          `- Thời gian học: tổng ~${minutesTotal} phút, 7 ngày gần nhất ~${minutesLast7} phút.\n` +
          `- Inactive (ước tính): ${inactiveDays ?? 'N/A'} ngày, tab-out: ${tabOutCount ?? 0} lần.\n` +
          `Hãy tóm tắt ngắn gọn tình hình học tập của riêng học viên này và đưa ra 2-4 gợi ý cụ thể để cải thiện hoặc duy trì phong độ.`,
      },
    ];

    let summary = '';
    try {
      const resp = await openrouterChat({
        messages,
        temperature: 0.3,
        max_retries: 2,
        per_try_timeout_ms: 15000,
      });
      summary = resp?.choices?.[0]?.message?.content || '';
    } catch (e) {
      console.error('LLM student summary failed, fallback heuristic', e);
      summary =
        `**Tổng quan:** Tiến độ ${completionPct}%, điểm quiz TB ${avgQuizPct ?? 'N/A'}%, còn ${weakQuizCount} quiz dưới 50%. ` +
        `**Cần chú ý:** inactive ~${inactiveDays ?? 'N/A'} ngày, tab-out ${tabOutCount ?? 0} lần. ` +
        `**Gợi ý hành động:** - Dành thêm thời gian cho các quiz điểm thấp. - Tăng thời lượng học thực sự tập trung (giảm tab-out).`;
    }

    return res.json({ summary });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Failed to summarize student analytics', error);
    return res.status(500).json({ error: 'Failed to summarize student analytics' });
  }
}

export async function getCoursePerformance(req, res) {
  try {
    const courseId = parseCourseId(req.query.courseId);
    await authorizeCourseAccess(courseId, req);
    const result = await computeCoursePerformance(courseId);
    return res.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Failed to load performance analytics', error);
    return res.status(500).json({ error: 'Failed to load performance analytics' });
  }
}

export async function getCourseEngagement(req, res) {
  try {
    const courseId = parseCourseId(req.query.courseId);
    await authorizeCourseAccess(courseId, req);
    const result = await computeCourseEngagement(courseId);
    return res.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Failed to load engagement analytics', error);
    return res.status(500).json({ error: 'Failed to load engagement analytics' });
  }
}

export async function getCourseBehavior(req, res) {
  try {
    const courseId = parseCourseId(req.query.courseId);
    await authorizeCourseAccess(courseId, req);
    const result = await computeCourseBehavior(courseId);
    return res.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Failed to load behavior analytics', error);
    return res.status(500).json({ error: 'Failed to load behavior analytics' });
  }
}

export async function getCourseAnalytics(req, res) {
  try {
    const courseIdParam = req.params.courseId ?? req.query.courseId;
    const courseId = parseCourseId(courseIdParam);
    await authorizeCourseAccess(courseId, req);
    const [performance, engagement, behavior, perUserStats, userQuizStats, userCompletions, perQuizScores] =
      await Promise.all([
        computeCoursePerformance(courseId),
        computeCourseEngagement(courseId),
        computeCourseBehavior(courseId),
        computePerUserStats(courseId),
        computeUserQuizStats(courseId),
        computeUserCompletions(courseId),
        computePerQuizScores(courseId),
      ]);

    const weakQuizMap = new Map();
    perQuizScores.forEach((quiz) => {
      quiz.scores?.forEach((s) => {
        if (s.userId && s.scorePct !== undefined && s.scorePct < 0.5) {
          weakQuizMap.set(s.userId, (weakQuizMap.get(s.userId) || 0) + 1);
        }
      });
    });

    const insights = perUserStats.map((u) => {
      const quizStat = userQuizStats.get(u.userId) || { attempts: 0, avgScore: null };
      const completion = userCompletions.find((c) => c.userId === u.userId);
      const risk = computeRiskLevel({
        completionRate: completion?.completionRate,
        avgScore: quizStat.avgScore,
        inactiveDays: u.inactiveDays ?? 0,
      });
      const verdict = classifyLearner({
        minutes: u.studyMinutesTotal ?? 0,
        tabOut: u.tabOutCount ?? 0,
        inactiveDays: u.inactiveDays ?? 0,
        avgScore: quizStat.avgScore,
        attempts: quizStat.attempts,
      });
      return {
        userId: u.userId,
        name: u.name,
        email: u.email,
        avgScore: quizStat.avgScore ?? null,
        attempts: quizStat.attempts ?? 0,
        completionRate: completion?.completionRate ?? null,
        weakQuizCount: weakQuizMap.get(u.userId) || 0,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        verdict,
      };
    }).sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

    return res.json({
      courseId,
      performance,
      engagement,
      behavior,
      perUserStats,
      userCompletions,
      perQuizScores,
      loginsByUser: engagement?.loginsByUser ?? [],
      insights,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Failed to load course analytics', error);
    return res.status(500).json({ error: 'Failed to load course analytics' });
  }
}

export async function getCourseSummary(req, res) {
  try {
    const courseIdParam = req.body?.courseId ?? req.query.courseId;
    const courseId = parseCourseId(courseIdParam);
    const course = await authorizeCourseAccess(courseId, req);

    const [performance, engagement, behavior] = await Promise.all([
      computeCoursePerformance(courseId),
      computeCourseEngagement(courseId),
      computeCourseBehavior(courseId),
    ]);

    const completionRate = performance?.completion?.completionRate ?? 0;
    const completedLessons = performance?.completion?.completedLessons ?? 0;
    const totalLessons = performance?.completion?.totalLessons ?? 0;
    const avgQuiz = performance?.averageQuizScore?.averageScore ?? null;
    const quizCount = performance?.averageQuizScore?.quizCount ?? 0;
    const inactiveDays = behavior?.inactiveDays ?? null;
    const tabOutCount = behavior?.tabOutCount ?? null;
    const pattern = behavior?.pattern ?? null;
    const onTimeRate = performance?.onTimeSubmissionRate ?? null;

    const completionPct = Math.round((completionRate || 0) * 100);
    const avgQuizPct = avgQuiz !== null ? Math.round(avgQuiz * 100) : null;
    const onTimePct = onTimeRate !== null ? Math.round(onTimeRate * 100) : null;

    const context = {
      courseId,
      courseTitle: course.title,
      completion: { completedLessons, totalLessons, completionPct },
      quiz: { avgQuizPct, quizCount },
      behavior: { inactiveDays, tabOutCount, pattern },
      onTimePct,
    };

    const messages = [
      {
        role: 'system',
        content:
          'Bạn là trợ lý phân tích giáo dục. Trả lời tiếng Việt, ngắn gọn (80-120 từ), giọng người, súc tích. ' +
          'Định dạng Markdown: **Trạng thái:** ...; **Rủi ro:** ...; **Khuyến nghị:** với 1-2 bullet. ' +
          'Không bịa số; chỉ dùng số liệu đã cho.',
      },
      {
        role: 'user',
        content:
          `Dữ liệu khóa học:\n` +
          `- Tiến độ: ${completionPct}% (${completedLessons}/${totalLessons} bài)\n` +
          `- Quiz TB: ${avgQuizPct ?? 'N/A'}% (quiz count: ${quizCount})\n` +
          `- Tỷ lệ nộp đúng hạn: ${onTimePct ?? 'N/A'}%\n` +
          `- Inactive (gần nhất): ${inactiveDays ?? 'N/A'} ngày\n` +
          `- Tab-out: ${tabOutCount ?? 'N/A'} lần; pattern: ${pattern ?? 'N/A'}\n` +
          `Hãy tóm tắt và đưa khuyến nghị, định dạng Markdown với các gạch đầu dòng rõ ràng.`,
      },
    ];

    let summary = '';
    try {
      const resp = await openrouterChat({
        messages,
        temperature: 0.3,
        max_retries: 2,
        per_try_timeout_ms: 15000,
      });
      summary = resp?.choices?.[0]?.message?.content || '';
    } catch (e) {
      console.error('LLM summary failed, fallback heuristic', e);
      summary =
        `**Trạng thái:** Tiến độ ${completionPct}%, quiz TB ${avgQuizPct ?? 'N/A'}%, on-time ${onTimePct ?? 'N/A'}%.` +
        ` **Rủi ro:** inactive ≈${inactiveDays ?? 'N/A'} ngày, tab-out ${tabOutCount ?? 'N/A'}.` +
        ` **Khuyến nghị:** - Theo dõi thêm hoạt động và nhắc tiến độ.`;
    }

    return res.json({ summary });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Failed to summarize analytics', error);
    return res.status(500).json({ error: 'Failed to summarize analytics' });
  }
}
