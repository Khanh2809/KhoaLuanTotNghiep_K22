/* eslint-disable no-console */
import 'dotenv/config';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

function textBlock(title, topic) {
  return {
    blockType: 'TEXT',
    displayOrder: 1,
    textMarkdown: `# ${title}\nTóm tắt nhanh về chủ đề ${topic}.`,
  };
}

function videoBlock() {
  return {
    blockType: 'VIDEO',
    displayOrder: 2,
    videoUrl: 'https://www.youtube.com/embed/dGcsHMXbSOA',
    videoDuration: 300,
    caption: 'Video minh hoa',
  };
}

function quizTemplate(idx, topic) {
  return {
    title: `Quiz ${idx}`,
    description: `Kiểm tra nhanh kiến thức về ${topic}`,
    timeLimit: 10,
    attemptsAllowed: 3,
    questions: {
      create: [
        {
          text: `Câu hỏi 1 về ${topic}?`,
          type: 'SINGLE_CHOICE',
          order: 1,
          points: 1,
          options: { create: [{ text: 'Đáp án', isCorrect: true, order: 1 }, { text: 'Sai', isCorrect: false, order: 2 }] },
        },
        {
          text: `Câu hỏi 2 về ${topic}?`,
          type: 'SINGLE_CHOICE',
          order: 2,
          points: 1,
          options: { create: [{ text: 'Đáp án', isCorrect: true, order: 1 }, { text: 'Sai', isCorrect: false, order: 2 }] },
        },
      ],
    },
  };
}

async function createCourse(instructorId, categoryId, title, slugIdx, topic, moduleTopics) {
  const modules = [];
  let quizCounter = 1;
  for (let m = 1; m <= 5; m++) {
    const lessons = [];
    const moduleLabel = moduleTopics[m - 1] || `${topic} - Module ${m}`;
    for (let l = 1; l <= 4; l++) {
      const hasQuiz = (l + m) % 2 === 0;
      const lessonTitle = `Bài ${m}.${l}: ${moduleLabel}`;
      lessons.push({
        title: lessonTitle,
        description: `Kiến thức trọng tâm: ${moduleLabel}`,
        order: l,
        blocks: { create: [textBlock(lessonTitle, topic), videoBlock()] },
        quizzes: hasQuiz ? { create: [quizTemplate(quizCounter++, topic)] } : undefined,
      });
    }
    modules.push({ title: moduleLabel, order: m, lessons: { create: lessons } });
  }

  return prisma.course.create({
    data: {
      title,
      description: `Khoá học ${topic} được seed tự động với nội dung tiếng Việt.`,
      instructorId,
      categoryId,
      status: 'PUBLISHED',
      slug: `course-${slugIdx}`,
      modules: { create: modules },
    },
    include: {
      modules: { include: { lessons: { include: { quizzes: true } } } },
    },
  });
}

async function main() {
  // Clear tables
  await prisma.activityLog.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonBlock.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  const [roleStudent, roleInstructor, roleAdmin] = await Promise.all([
    prisma.role.create({ data: { name: 'student' } }),
    prisma.role.create({ data: { name: 'instructor' } }),
    prisma.role.create({ data: { name: 'admin' } }),
  ]);

  const instructor = await prisma.user.create({
    data: { name: 'Instructor Seed', email: 'instructor@demo.com', passwordHash: 'hashed', roleId: roleInstructor.id },
  });

  const students = await Promise.all(
    Array.from({ length: 5 }).map((_, idx) =>
      prisma.user.create({
        data: { name: `Student ${idx + 1}`, email: `student${idx + 1}@demo.com`, passwordHash: 'hashed', roleId: roleStudent.id },
      })
    )
  );

  await prisma.user.create({
    data: { name: 'Root Admin', email: 'admin@demo.com', passwordHash: 'hashed', roleId: roleAdmin.id },
  });

  const category = await prisma.courseCategory.create({ data: { name: 'Demo Category', description: 'Seed data' } });

  // Create 3 courses
  const courses = [];
  courses.push(
    await createCourse(
      instructor.id,
      category.id,
      'Khoá học Angular căn bản',
      1,
      'Angular',
      [
        'Làm quen Angular & kiến trúc',
        'Template, Binding & Component',
        'Services & Dependency Injection',
        'Routing & Guard',
        'Forms & Validation',
      ]
    )
  );
  courses.push(
    await createCourse(
      instructor.id,
      category.id,
      'Thiết kế giao diện với Figma',
      2,
      'Figma',
      [
        'Làm quen Figma & Frame',
        'Component, Variant, Auto Layout',
        'Grid, Constraint & Responsive',
        'Prototype & Interaction',
        'Design System & Export',
      ]
    )
  );
  courses.push(
    await createCourse(
      instructor.id,
      category.id,
      'Luyện thi TOEIC',
      3,
      'TOEIC',
      [
        'Nghe Part 1-2',
        'Nghe Part 3-4',
        'Đọc Part 5-6',
        'Đọc Part 7',
        'Từ vựng & Ngữ pháp trọng điểm',
      ]
    )
  );

  // Enroll students to all courses
  for (const course of courses) {
    for (const student of students) {
      await prisma.enrollment.create({ data: { userId: student.id, courseId: course.id } });
    }
  }

  // Collect quizzes
  const allQuizzes = [];
  courses.forEach((c) =>
    c.modules.forEach((m) =>
      m.lessons.forEach((ls) => {
        if (ls.quizzes?.length) allQuizzes.push(...ls.quizzes);
      })
    )
  );

  // Ensure at least 15 quizzes (with pattern created ~30); take first 15 for submissions
  const quizzesForSubs = allQuizzes.slice(0, 15);

  // Create 50 submissions with varied scores
  let subCount = 0;
  for (const quiz of quizzesForSubs) {
    for (const student of students) {
      if (subCount >= 50) break;
      const score = Math.floor(Math.random() * 3); // 0-2 points
      await prisma.submission.create({
        data: {
          quizId: quiz.id,
          userId: student.id,
          attemptNumber: 1,
          submittedAt: new Date(),
          score,
        },
      });
      subCount++;
    }
    if (subCount >= 50) break;
  }

  // Seed 300 activity logs
  const activityTypes = ['LOGIN', 'LESSON_OPEN', 'QUIZ_START', 'QUIZ_SUBMIT', 'TAB_OUT', 'IDLE'];
  const logs = [];
  for (let i = 0; i < 300; i++) {
    const course = courses[i % courses.length];
    const module = course.modules[0];
    const lesson = module.lessons[i % module.lessons.length];
    const user = students[i % students.length];
    logs.push({
      userId: user.id,
      courseId: course.id,
      lessonId: lesson.id,
      eventType: activityTypes[i % activityTypes.length],
      createdAt: new Date(Date.now() - i * 60000),
    });
  }
  await prisma.activityLog.createMany({ data: logs });

  console.log('Seeded demo data:', {
    courses: courses.length,
    modulesPerCourse: 5,
    lessonsPerCourse: 20,
    quizzes: allQuizzes.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
