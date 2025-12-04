export type Material = {
  id: number;
  type: 'video' | 'pdf' | 'quiz' | 'assignment';
  title: string;
  url?: string;        // video/pdf
  durationMin?: number;
};

export type Lesson = {
  id: number;
  title: string;
  quizId?: number | null;
  materials: Material[];
};

export type Module = {
  id: number;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  durationH?: number;
  price?: number;
  rating?: number;
  instructor?: string;

  lessons?: { id: number; title: string }[]; // <- optional
  modules?: Module[];

  lessonCount?: number; // <- thêm nếu chưa có
};
