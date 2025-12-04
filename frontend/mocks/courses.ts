import type { Course } from '../types/course';

export const MOCK_COURSES: Course[] = [
  {
    id: 1,
    title: 'TOEIC Cơ Bản 0-450+',
    description: 'Ôn lại các thì cơ bản và từ vựng',
    thumbnail: '/toeic.png',
    category: 'Language',
    difficulty: 'beginner',
    durationH: 6,
    price: 0,
    rating: 4.7,
    instructor: 'Jane Doe',
    lessons: [
      { id: 101, title: 'Present Simple' },
      { id: 102, title: 'Present Perfect' },
    ],
    modules: [
      {
        id: 10,
        title: 'Present Tenses',
        lessons: [
          {
            id: 101,
            title: 'Present Simple',
            materials: [
              { id: 1, type: 'video', title: 'Video - Present Simple', url: 'https://example.com/video1', durationMin: 12 },
              { id: 2, type: 'pdf', title: 'Slides - Present Simple', url: 'https://example.com/slides1' },
              { id: 3, type: 'quiz', title: 'Quiz - Present Simple' },
            ],
          },
          {
            id: 102,
            title: 'Present Perfect',
            materials: [
              { id: 4, type: 'video', title: 'Video - Present Perfect', url: 'https://example.com/video2', durationMin: 15 },
              { id: 5, type: 'assignment', title: 'Assignment - Write examples' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Giới thiệu về Phát triển Web',
    description: 'Các kiến thức cơ bản về HTML/CSS/JS cho người mới bắt đầu.',
    thumbnail: '/frontend.jpg',
    category: 'Programming',
    lessons: [
      { id: 201, title: 'HTML Basics' },
      { id: 202, title: 'CSS Layout' },
    ],
  },
  {
    id: 3,
    title: 'PostgreSQL cơ bản',
    description: 'Bảng, quan hệ, và các truy vấn đơn giản.',
    thumbnail: '/psql.png',
    category: 'Database',
    lessons: [
      { id: 301, title: 'Relational basics' },
      { id: 302, title: 'SELECT & WHERE' },
    ],
  },
];
