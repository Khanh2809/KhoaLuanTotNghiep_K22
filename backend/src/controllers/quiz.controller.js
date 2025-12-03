import pkg from '@prisma/client';
import { prisma } from '../lib/db.js';

const { Prisma, QuestionType } = pkg;

/** =========================
 *  QUIZ CRUD
 *  ========================= */
export async function createQuiz(req, res) {
  try {
    const { lessonId, title, description, timeLimit, attemptsAllowed, deadline } = req.body;
    const lesson = Number(lessonId);

    if (!lesson || Number.isNaN(lesson)) {
      return res.status(400).json({ error: 'Invalid lessonId' });
    }

    let parsedDeadline = null;
    if (deadline) {
      const dt = new Date(deadline);
      if (Number.isNaN(dt.getTime())) {
        return res.status(400).json({ error: 'Invalid deadline' });
      }
      parsedDeadline = dt;
    }

    // 1 lesson chỉ có 1 quiz: pre-check để trả 409 kèm quizId
    const existing = await prisma.quiz.findUnique({
      where: { lessonId: lesson },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: 'QUIZ_EXISTS_FOR_LESSON', quizId: existing.id });
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: lesson,
        title,
        description,
        timeLimit,
        attemptsAllowed,
        deadline: parsedDeadline,
      },
    });

    res.status(201).json(quiz);
  } catch (e) {
    // Bắt duplicate nếu vì lý do race-condition
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      try {
        const dup = await prisma.quiz.findUnique({
          where: { lessonId: Number(req.body?.lessonId) },
          select: { id: true },
        });
        return res
          .status(409)
          .json({ error: 'QUIZ_EXISTS_FOR_LESSON', quizId: dup?.id || undefined });
      } catch {
        return res.status(409).json({ error: 'QUIZ_EXISTS_FOR_LESSON' });
      }
    }
    console.error(e);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
}

export async function getQuiz(req, res) {
  const { id } = req.params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: Number(id) },
    include: { questions: { include: { options: true } } },
  });

  if (!quiz) return res.status(404).json({ error: 'Not found' });
  res.json(quiz);
}

export async function updateQuiz(req, res) {
  const { id } = req.params;
  const { title, description, isPublished, timeLimit, attemptsAllowed, deadline } = req.body;

  const data = { title, description, isPublished, timeLimit, attemptsAllowed };

  if (Object.prototype.hasOwnProperty.call(req.body, 'deadline')) {
    if (deadline) {
      const dt = new Date(deadline);
      if (Number.isNaN(dt.getTime())) {
        return res.status(400).json({ error: 'Invalid deadline' });
      }
      data.deadline = dt;
    } else {
      data.deadline = null;
    }
  }

  const qz = await prisma.quiz.update({
    where: { id: Number(id) },
    data,
  });

  res.json(qz);
}

export async function deleteQuiz(req, res) {
  const { id } = req.params;
  await prisma.quiz.delete({ where: { id: Number(id) } });
  res.json({ ok: true });
}

/** =========================
 *  LIST QUIZZES BY COURSE
 *  ========================= */
export async function listQuizzesByCourse(req, res) {
  try {
    const courseId = Number(req.params.id);
    if (!courseId || Number.isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course id' });
    }

    const user = req.user || null;
    const where =
      user?.role === 'admin'
        ? { lesson: { module: { courseId } } }
        : { lesson: { module: { courseId, course: { instructorId: user?.id ?? -1 } } } };

    const rows = await prisma.quiz.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        lessonId: true,
        lesson: { select: { id: true, title: true } },
      },
      orderBy: { id: 'desc' },
    });

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list quizzes' });
  }
}

/** =========================
 *  QUESTION CRUD
 *  ========================= */
export async function addQuestion(req, res) {
  const { id } = req.params; // quizId
  const { text, type, points, order, options, correctTextAnswer } = req.body;

  const q = await prisma.question.create({
    data: {
      quizId: Number(id),
      text,
      type,                                // SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE | SHORT_TEXT
      points: points ?? 1,
      order: order ?? 1,
      correctTextAnswer: correctTextAnswer ?? null,
      options: options?.length
        ? {
            create: options.map((o, i) => ({
              text: o.text,
              isCorrect: !!o.isCorrect,
              order: o.order ?? i + 1,
            })),
          }
        : undefined,
    },
    include: { options: true },
  });

  res.status(201).json(q);
}


export async function deleteQuestion(req, res) {
  const { qid } = req.params;
  await prisma.question.delete({ where: { id: Number(qid) } });
  res.json({ ok: true });
}

/** =========================
 *  SUBMIT + AUTO GRADING
 *  ========================= */
export async function submitQuiz(req, res) {
  const { id } = req.params;          // quizId
  const userId = Number(req.user.id);
  const { submissionId, answers } = req.body;

  await Promise.all(
    answers.map(a =>
      prisma.answer.create({
        data: {
          submissionId: Number(submissionId),
          questionId: Number(a.questionId),
          selectedOptionIds: a.selectedOptionIds ?? [],
          textAnswer: a.textAnswer ?? null,
        },
      })
    )
  );

  const sub = await prisma.submission.findUnique({
    where: { id: Number(submissionId) },
    include: {
      answers: true,
      quiz: {
        include: {
          questions: { include: { options: true } },
        },
      },
    },
  });

  let total = 0;
  for (const q of sub.quiz.questions) total += q.points ?? 1;

  let earned = 0;
  for (const ans of sub.answers) {
    const q = sub.quiz.questions.find(qq => qq.id === ans.questionId);
    if (!q) continue;

    if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
      const correct = q.options.find(o => o.isCorrect)?.id;
      const ok =
        ans.selectedOptionIds?.length === 1 &&
        Number(ans.selectedOptionIds[0]) === Number(correct);

      if (ok) earned += q.points ?? 1;
      await prisma.answer.update({ where: { id: ans.id }, data: { isCorrect: ok } });
    }

    if (q.type === QuestionType.MULTIPLE_CHOICE) {
      const correctIds = q.options.filter(o => o.isCorrect).map(o => String(o.id)).sort();
      const chosen = (ans.selectedOptionIds ?? []).map(String).sort();
      const ok = JSON.stringify(correctIds) === JSON.stringify(chosen);

      if (ok) earned += q.points ?? 1;
      await prisma.answer.update({ where: { id: ans.id }, data: { isCorrect: ok } });
    }

    if (q.type === QuestionType.SHORT_TEXT) {
      const ok =
        q.correctTextAnswer && ans.textAnswer
          ? q.correctTextAnswer.trim().toLowerCase() === ans.textAnswer.trim().toLowerCase()
          : false;

      if (ok) earned += q.points ?? 1;
      await prisma.answer.update({ where: { id: ans.id }, data: { isCorrect: ok } });
    }
  }

  await prisma.submission.update({
    where: { id: Number(submissionId) },
    data: { submittedAt: new Date(), score: earned },
  });

  res.json({ score: earned, total });
}

export async function updateQuestion(req, res) {
  const { qid } = req.params;
  const { text, type, points, order, correctTextAnswer, options } = req.body;

  const data = { text, type, points, order, correctTextAnswer: null };
  if (type === 'SHORT_TEXT') {
    data.correctTextAnswer = correctTextAnswer ?? null;
  } else if (Array.isArray(options)) {
    data.options = {
      deleteMany: { questionId: Number(qid) },
      create: options.map((o, idx) => ({
        text: o.text,
        isCorrect: !!o.isCorrect,
        order: o.order ?? idx + 1,
      })),
    };
  }

  const q = await prisma.question.update({
    where: { id: Number(qid) },
    data,
    include: { options: true },
  });

  res.json(q);
}

export async function getSubmission(req, res) {
  const { sid } = req.params;
  const submission = await prisma.submission.findUnique({
    where: { id: Number(sid) },
    include: {
      quiz: { include: { questions: true } },
    },
  });
  if (!submission || submission.userId !== req.user.id)
    return res.status(404).json({ error: 'Not found' });

  const total =
    submission.quiz.questions?.reduce((sum, q) => sum + (q.points ?? 1), 0) ?? 0;

  res.json({ id: submission.id, score: submission.score ?? 0, total });
}


export async function startAttempt(req, res) {
  const { id } = req.params;
  const userId = Number(req.user.id);

  const quiz = await prisma.quiz.findUnique({
    where: { id: Number(id) },
    select: { attemptsAllowed: true },
  });
  if (!quiz) return res.status(404).json({ error: 'Not found' });

  const count = await prisma.submission.count({
    where: { quizId: Number(id), userId },
  });
  if (quiz.attemptsAllowed && count >= quiz.attemptsAllowed) {
    return res.status(403).json({ error: 'ATTEMPT_LIMIT_REACHED' });
  }

  const submission = await prisma.submission.create({
    data: { quizId: Number(id), userId, attemptNumber: count + 1 },
  });

  res.status(201).json(submission);
}
