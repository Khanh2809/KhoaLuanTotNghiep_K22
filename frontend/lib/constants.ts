export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';


export const COURSE_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;
export type CourseStatus = typeof COURSE_STATUS[keyof typeof COURSE_STATUS];

export const ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;
export type BasicRole = typeof ROLES[keyof typeof ROLES];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  COURSES: {
    ROOT: '/api/courses',
    BY_ID: (id: number) => `/api/courses/${id}`,
  },
  ENROLLMENTS: {
    ROOT: '/api/enrollments',
    STATUS: (courseId: number) => `/api/enrollments/status/${courseId}`,
  },
  PROGRESS: {
    ROOT: '/api/progress',
    TOUCH: '/api/progress/touch',
  },
  CHAT: '/api/chat',
  SEARCH: '/api/search',
  REVIEWS: '/api/reviews',
  LESSONS: {
    QUESTIONS: (lessonId: number) => `/api/lessons/${lessonId}/questions`,
  },
  ROLE_REQUESTS: {
    ROOT: '/api/role-requests',
    MINE: '/api/role-requests/me',
    ADMIN_ROOT: '/api/admin/role-requests',
    ADMIN_APPROVE: (id: number) => `/api/admin/role-requests/${id}/approve`,
    ADMIN_REJECT: (id: number) => `/api/admin/role-requests/${id}/reject`,
  },
  LEARNING_PATHS: {
    ROOT: '/api/learning-paths',
    BY_ID: (id: number) => `/api/learning-paths/${id}`,
    ENROLL: (id: number) => `/api/learning-paths/${id}/enroll`,
  },
  CERTIFICATES: {
    ROOT: '/api/certificates',
    VERIFY: (code: string) => `/api/certificates/verify/${code}`,
    REQUEST: '/api/certificates/request',
    STATUS: (courseId: number) => `/api/certificates/status?courseId=${courseId}`,
  },
} as const;


