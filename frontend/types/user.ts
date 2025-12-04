export type Role = 'student' | 'instructor' | 'manager' | 'partner' | 'guest';

export type User = {
  id: number;
  name: string;
  role: Role;
  preferences?: { categories: string[]; level?: string };
  enrolledCourseIds?: number[];
  wishlistCourseIds?: number[];
};
