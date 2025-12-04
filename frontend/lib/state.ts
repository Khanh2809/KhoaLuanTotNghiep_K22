import type { Role, User } from '@/types/user';

let currentLang: 'en' | 'vi' = 'en';
let currentUser: User | null = {
  id: 1,
  name: 'Bạn',
  role: 'student',
  preferences: { categories: ['Language', 'Programming'] },
  enrolledCourseIds: [1],
  wishlistCourseIds: [3],
};

export const appState = {
  getLang: () => currentLang,
  setLang: (l: 'en' | 'vi') => (currentLang = l),
  getUser: () => currentUser,
  setRole: (r: Role) => { if (currentUser) currentUser.role = r; },
  signOut: () => (currentUser = null),
};
