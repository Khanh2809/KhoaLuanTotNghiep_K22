import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertRole(name) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertUser(email, roleId, name, passwordHash = 'seed-password-hash') {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, roleId },
  });
}

async function main() {
  const roleInstructor = await upsertRole('instructor');
  const roleStudent = await upsertRole('student');

  const instructor = await upsertUser(
    'instructor+analytics@example.com',
    roleInstructor.id,
    'Analytics Instructor'
  );

  const students = await Promise.all(
    Array.from({ length: 5 }).map((_, idx) =>
      upsertUser(
        `student${idx + 1}+analytics@example.com`,
        roleStudent.id,
        `Analytics Student ${idx + 1}`
      )
    )
  );

  const course = await prisma.course.upsert({
    where: { slug: 'analytics-demo-course' },
    update: {},
    create: {
      slug: 'analytics-demo-course',
      title: 'Analytics Demo Course',
      instructorId: instructor.id,
      description: 'Course seeded for analytics testing',
      status: 'PUBLISHED',
    },
  });

  const existingModule = await prisma.courseModule.findFirst({
    where: { courseId: course.id },
  });
  const module =
    existingModule ||
    (await prisma.courseModule.create({
      data: {
        courseId: course.id,
        title: 'Module 1',
        description: 'Seeded module',
        order: 1,
      },
    }));

  let lessons = await prisma.lesson.findMany({
    where: { moduleId: module.id },
    orderBy: { order: 'asc' },
  });
  if (lessons.length < 5) {
    const toCreate = 5 - lessons.length;
    const created = await Promise.all(
      Array.from({ length: toCreate }).map((_, idx) =>
        prisma.lesson.create({
          data: {
            moduleId: module.id,
            title: `Seeded Lesson ${lessons.length + idx + 1}`,
            description: 'Seeded lesson for analytics',
            order: lessons.length + idx + 1,
          },
        })
      )
    );
    lessons = [...lessons, ...created].sort((a, b) => a.order - b.order);
  }

  const existingQuiz = await prisma.quiz.findFirst({
    where: { lessonId: lessons[0].id },
    include: { questions: true },
  });
  const quiz =
    existingQuiz ||
    (await prisma.quiz.create({
      data: {
        lessonId: lessons[0].id,
        title: 'Seeded Quiz',
        description: 'Quiz for analytics',
        timeLimit: 15,
        attemptsAllowed: 3,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        questions: {
          create: [
            { text: 'Q1', type: 'SINGLE_CHOICE', order: 1, points: 1, options: { create: [
              { text: 'A', isCorrect: true, order: 1 },
              { text: 'B', isCorrect: false, order: 2 },
            ] } },
            { text: 'Q2', type: 'SINGLE_CHOICE', order: 2, points: 2, options: { create: [
              { text: 'A', isCorrect: false, order: 1 },
              { text: 'B', isCorrect: true, order: 2 },
            ] } },
          ],
        },
      },
      include: { questions: true },
    }));

  for (const student of students) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
      update: {},
      create: { userId: student.id, courseId: course.id },
    });
  }

  // Seed submissions with scores
  for (const [idx, student] of students.entries()) {
    await prisma.submission.create({
      data: {
        quizId: quiz.id,
        userId: student.id,
        attemptNumber: 1,
        submittedAt: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000),
        score: idx % 2 === 0 ? 3 : 1,
      },
    });
  }

  // Activity log patterns
  const now = new Date();
  const logs = [];
  const lessonDay = (offset) => new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);

  // Student 1: consistent daily study
  for (let d = 1; d <= 5; d++) {
    logs.push(
      { userId: students[0].id, courseId: course.id, lessonId: lessons[0].id, eventType: 'LESSON_OPEN', createdAt: lessonDay(d) },
      { userId: students[0].id, courseId: course.id, lessonId: lessons[0].id, eventType: 'TAB_OUT', createdAt: new Date(lessonDay(d).getTime() + 20 * 60 * 1000) },
    );
  }

  // Student 2: sporadic with tab-outs
  logs.push(
    { userId: students[1].id, courseId: course.id, lessonId: lessons[1].id, eventType: 'LESSON_OPEN', createdAt: lessonDay(1) },
    { userId: students[1].id, courseId: course.id, lessonId: lessons[1].id, eventType: 'TAB_OUT', createdAt: new Date(lessonDay(1).getTime() + 5 * 60 * 1000) },
    { userId: students[1].id, courseId: course.id, lessonId: lessons[2].id, eventType: 'LESSON_OPEN', createdAt: lessonDay(4) },
    { userId: students[1].id, courseId: course.id, lessonId: lessons[2].id, eventType: 'TAB_OUT', createdAt: new Date(lessonDay(4).getTime() + 8 * 60 * 1000) },
    { userId: students[1].id, courseId: course.id, lessonId: lessons[2].id, eventType: 'IDLE', createdAt: new Date(lessonDay(4).getTime() + 10 * 60 * 1000) },
  );

  // Student 3: burst learning
  for (let session = 0; session < 3; session++) {
    const start = lessonDay(2);
    logs.push(
      { userId: students[2].id, courseId: course.id, lessonId: lessons[3].id, eventType: 'LESSON_OPEN', createdAt: new Date(start.getTime() + session * 60 * 60 * 1000) },
      { userId: students[2].id, courseId: course.id, lessonId: lessons[3].id, eventType: 'TAB_OUT', createdAt: new Date(start.getTime() + session * 60 * 60 * 1000 + 15 * 60 * 1000) },
    );
  }

  // Logins last 7 days
  for (let d = 0; d < 7; d++) {
    logs.push({ userId: students[0].id, eventType: 'LOGIN', createdAt: lessonDay(d) });
    if (d % 2 === 0) logs.push({ userId: students[1].id, eventType: 'LOGIN', createdAt: lessonDay(d) });
  }

  await prisma.activityLog.createMany({ data: logs, skipDuplicates: true });

  console.log('Seeded analytics demo data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
