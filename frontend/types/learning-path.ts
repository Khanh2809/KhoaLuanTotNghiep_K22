export type LearningPathItem = {
  id: number;
  courseId: number;
  order: number;
  courseTitle: string;
  courseSlug?: string | null;
  status?: string | null;
};

export type LearningPath = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  isPublished?: boolean;
  courseCount?: number;
  enrollmentCount?: number;
  items?: LearningPathItem[];
};
