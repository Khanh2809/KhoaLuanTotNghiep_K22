/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_SLUG = 'data-analytics-360';
const PREP_COURSE_SLUG = 'data-foundations-101';
const PATH_SLUG = 'data-career-roadmap';

function textBlock(title, description) {
  return {
    blockType: 'TEXT',
    displayOrder: 1,
    textMarkdown: `## ${title}\n${description}`,
  };
}

function videoBlock(url) {
  return {
    blockType: 'VIDEO',
    displayOrder: 2,
    videoUrl: url,
    videoDuration: 420,
    caption: 'Video minh hoạ, cần xử lý/transcode',
  };
}

function quizTemplate(title, topic) {
  return {
    title,
    description: `Quiz kiểm tra hiểu biết: ${topic}`,
    timeLimit: 15,
    attemptsAllowed: 2,
    questions: {
      create: [
        {
          text: `Khái niệm chính của ${topic}?`,
          type: 'SINGLE_CHOICE',
          order: 1,
          points: 2,
          options: {
            create: [
              { text: 'Câu trả lời đúng', isCorrect: true, order: 1 },
              { text: 'Phương án nhiễu', isCorrect: false, order: 2 },
            ],
          },
        },
        {
          text: `Tình huống thực tế liên quan ${topic}?`,
          type: 'MULTIPLE_CHOICE',
          order: 2,
          points: 3,
          options: {
            create: [
              { text: 'A', isCorrect: true, order: 1 },
              { text: 'B', isCorrect: true, order: 2 },
              { text: 'C', isCorrect: false, order: 3 },
            ],
          },
        },
        {
          text: `Nhận định đúng/sai về ${topic}?`,
          type: 'TRUE_FALSE',
          order: 3,
          points: 1,
          options: {
            create: [
              { text: 'Đúng', isCorrect: true, order: 1 },
              { text: 'Sai', isCorrect: false, order: 2 },
            ],
          },
        },
      ],
    },
  };
}

async function upsertRole(name) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertUser(email, roleId, name) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash: 'seed-hash', roleId },
  });
}

async function seedUsers() {
  const [roleStudent, roleInstructor] = await Promise.all([upsertRole('student'), upsertRole('instructor')]);

  const instructor = await upsertUser('instructor+detailed@example.com', roleInstructor.id, 'Data Instructor');
  const students = await Promise.all(
    Array.from({ length: 12 }).map((_, idx) =>
      upsertUser(`learner${idx + 1}+detailed@example.com`, roleStudent.id, `Learner ${idx + 1}`)
    )
  );
  return { instructor, students };
}

async function seedCourses(instructorId, categoryId) {
  let prepCourse = await prisma.course.findUnique({ where: { slug: PREP_COURSE_SLUG } });
  if (!prepCourse) {
    prepCourse = await prisma.course.create({
      data: {
        title: 'Data Foundations 101',
        slug: PREP_COURSE_SLUG,
        description: 'Khoá nhập môn làm quen số liệu, bảng, biểu đồ cơ bản.',
        status: 'PUBLISHED',
        instructorId,
        categoryId,
        modules: {
          create: [
            {
              title: 'Làm quen dữ liệu',
              order: 1,
              lessons: {
                create: [
                  { title: 'CSV & Excel', order: 1 },
                  { title: 'Kiểu dữ liệu & chất lượng dữ liệu', order: 2 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  let course = await prisma.course.findUnique({
    where: { slug: COURSE_SLUG },
    include: { modules: { include: { lessons: true } } },
  });
  if (!course) {
    course = await prisma.course.create({
      data: {
        title: 'Data Analytics 360',
        slug: COURSE_SLUG,
        description: 'Lộ trình phân tích dữ liệu đầy đủ: SQL, trực quan hoá, ML cơ bản.',
        status: 'PUBLISHED',
        instructorId,
        categoryId,
        featured: true,
        seoTitle: 'Data Analytics 360 - Học phân tích dữ liệu toàn diện',
        seoDescription: 'Lộ trình thực chiến từ nền tảng tới dashboard, mô hình đơn giản.',
        modules: {
          create: [
            {
              title: 'SQL thực chiến',
              order: 1,
              lessons: {
                create: [
                  {
                    title: 'SELECT nâng cao',
                    order: 1,
                    description: 'Sử dụng CTE, window functions, aggregate.',
                    blocks: { create: [textBlock('SELECT nâng cao', 'CTE, window function, aggregate'), videoBlock('https://youtu.be/rvpIZj5S-sA')] },
                    quizzes: { create: [quizTemplate('Quiz SQL 1', 'CTE & Window')] },
                  },
                  {
                    title: 'Tối ưu truy vấn',
                    order: 2,
                    description: 'EXPLAIN plan, index, partition.',
                    blocks: { create: [textBlock('Tối ưu truy vấn', 'Index, partition, VACUUM'), videoBlock('https://youtu.be/sLtQbK5tmks')] },
                    quizzes: { create: [quizTemplate('Quiz SQL 2', 'Index & Performance')] },
                  },
                ],
              },
            },
            {
              title: 'Trực quan & kể chuyện dữ liệu',
              order: 2,
              lessons: {
                create: [
                  {
                    title: 'Dashboard tư duy',
                    order: 1,
                    description: 'Chọn biểu đồ, bố cục, đo lường chính.',
                    blocks: { create: [textBlock('Dashboard tư duy', 'Chọn KPI, chart phù hợp'), videoBlock('https://youtu.be/Idh3a5mZ8Hk')] },
                    quizzes: { create: [quizTemplate('Quiz Viz 1', 'Chọn biểu đồ')] },
                  },
                  {
                    title: 'Storytelling',
                    order: 2,
                    description: 'Chuỗi insight và narrative.',
                    blocks: { create: [textBlock('Storytelling', 'Insight, flow, annotation'), videoBlock('https://youtu.be/wWgIAphfn2U')] },
                  },
                ],
              },
            },
            {
              title: 'ML cơ bản',
              order: 3,
              lessons: {
                create: [
                  {
                    title: 'Hồi quy tuyến tính',
                    order: 1,
                    description: 'Chuẩn bị dữ liệu, train/test, hệ số.',
                    blocks: { create: [textBlock('Hồi quy', 'Feature, train/test split'), videoBlock('https://youtu.be/ZkjP5RJLQF4')] },
                    quizzes: { create: [quizTemplate('Quiz ML 1', 'Linear Regression')] },
                  },
                  {
                    title: 'Đánh giá mô hình',
                    order: 2,
                    description: 'MAE, RMSE, overfitting.',
                    blocks: { create: [textBlock('Đánh giá mô hình', 'Chỉ số lỗi, regularization'), videoBlock('https://youtu.be/Qzt6ttxzpks')] },
                    quizzes: { create: [quizTemplate('Quiz ML 2 - khó', 'Generalization & lỗi')] },
                  },
                ],
              },
            },
          ],
        },
      },
      include: { modules: { include: { lessons: true } } },
    });
  }

  await prisma.coursePrerequisite.upsert({
    where: { courseId_prerequisiteCourseId: { courseId: course.id, prerequisiteCourseId: prepCourse.id } },
    update: {},
    create: { courseId: course.id, prerequisiteCourseId: prepCourse.id },
  });

  // lesson prerequisite: bài sau yêu cầu bài trước trong cùng module
  for (const module of course.modules) {
    const sorted = [...module.lessons].sort((a, b) => a.order - b.order);
    for (let i = 1; i < sorted.length; i++) {
      await prisma.lessonPrerequisite.upsert({
        where: { lessonId_prerequisiteLessonId: { lessonId: sorted[i].id, prerequisiteLessonId: sorted[i - 1].id } },
        update: {},
        create: { lessonId: sorted[i].id, prerequisiteLessonId: sorted[i - 1].id },
      });
    }
  }

  return { course, prepCourse };
}

async function seedLearningPath(instructorId, courseIds) {
  const path = await prisma.learningPath.upsert({
    where: { slug: PATH_SLUG },
    update: { isPublished: true },
    create: {
      title: 'Data Analyst Roadmap',
      slug: PATH_SLUG,
      description: 'Đi từ nền tảng tới phân tích, dashboard và ML cơ bản.',
      isPublished: true,
      createdById: instructorId,
      items: {
        create: courseIds.map((cid, idx) => ({ courseId: cid, order: idx + 1 })),
      },
    },
  });
  return path;
}

async function seedEnrollments(students, courseIds, pathId) {
  for (const student of students) {
    for (const courseId of courseIds) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: student.id, courseId } },
        update: {},
        create: { userId: student.id, courseId },
      });
    }
    await prisma.learningPathEnrollment.upsert({
      where: { pathId_userId: { pathId, userId: student.id } },
      update: {},
      create: { pathId, userId: student.id, status: 'ACTIVE' },
    });
  }
}

async function seedSubmissions(courseId, students) {
  const quizzes = await prisma.quiz.findMany({
    where: { lesson: { module: { courseId } } },
    include: { questions: { select: { points: true } } },
  });
  const totals = new Map();
  quizzes.forEach((q) => {
    const total = q.questions.reduce((s, qq) => s + (qq.points ?? 1), 0) || q.questions.length || 1;
    totals.set(q.id, total);
  });

  // Mark first quiz as easy (80% pass), last quiz as khó (70% fail)
  const hardQuizId = quizzes[quizzes.length - 1]?.id;

  for (const quiz of quizzes) {
    const total = totals.get(quiz.id) || 5;
    const isHard = quiz.id === hardQuizId;
    let idx = 0;
    for (const student of students) {
      const fail = isHard ? idx % 3 !== 0 : idx % 5 === 0; // hard => ~66% fail, easy => ~20% fail
      const score = fail ? Math.floor(total * 0.3) : total;
      await prisma.submission.create({
        data: {
          quizId: quiz.id,
          userId: student.id,
          attemptNumber: 1,
          submittedAt: new Date(Date.now() - idx * 3600 * 1000),
          score,
        },
      });
      idx += 1;
    }
  }
}

async function seedProgressAndCertificates(courseId, instructorId, students) {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId } },
    select: { id: true },
    orderBy: { order: 'asc' },
  });
  const lessonIds = lessons.map((l) => l.id);

  // First 3 students hoàn thành toàn bộ
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const completed = i < 3 ? lessonIds : lessonIds.slice(0, Math.ceil(lessonIds.length / 2));
    await prisma.userProgress.createMany({
      data: completed.map((lessonId) => ({
        userId: student.id,
        lessonId,
        isCompleted: true,
      })),
      skipDuplicates: true,
    });
    if (i < 3) {
      const existing = await prisma.certificate.findFirst({ where: { userId: student.id, courseId } });
      if (!existing) {
        await prisma.certificate.create({
          data: {
            userId: student.id,
            courseId,
            score: 95 - i * 5,
            templateName: 'default',
            issuedById: instructorId,
          },
        });
      }
    }
  }
}

async function main() {
  const category = await prisma.courseCategory.upsert({
    where: { name: 'Data' },
    update: {},
    create: { name: 'Data', description: 'Khoá học dữ liệu' },
  });

  const { instructor, students } = await seedUsers();
  const { course, prepCourse } = await seedCourses(instructor.id, category.id);
  const path = await seedLearningPath(instructor.id, [prepCourse.id, course.id]);
  await seedEnrollments(students, [prepCourse.id, course.id], path.id);
  await seedSubmissions(course.id, students);
  await seedProgressAndCertificates(course.id, instructor.id, students);

  console.log('Seeded detailed course + path', {
    courseId: course.id,
    prepCourseId: prepCourse.id,
    pathId: path.id,
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
