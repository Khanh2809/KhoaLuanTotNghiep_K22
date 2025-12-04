import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';

export type GlobalSearchResult = {
  courses: Array<{
    id: number;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    instructor?: string | null;
    type: 'course';
  }>;
  lessons: Array<{
    id: number;
    title: string;
    courseId: number | null;
    courseTitle?: string | null;
    type: 'lesson';
  }>;
};

export async function fetchGlobalSearch(q: string): Promise<GlobalSearchResult> {
  const qs = new URLSearchParams();
  qs.set('q', q);

  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SEARCH}?${qs.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  return res.json();
}
