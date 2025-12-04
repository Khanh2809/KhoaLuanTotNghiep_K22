import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';
import { CurrentUser } from './providers/auth-context';

export type Question = {
  id: number;
  content: string;
  createdAt?: string;
  user?: { id: number; name?: string | null; email?: string | null; role?: string };
  replies?: Question[];
  parentId?: number | null;
};

export async function fetchQuestions(lessonId: number): Promise<Question[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSONS.QUESTIONS(lessonId)}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch questions');
  const raw = await res.json();
  const normalize = (q: any): Question => ({
    ...q,
    user: q.user
      ? { ...q.user, role: typeof q.user.role === 'object' ? q.user.role?.name : q.user.role }
      : q.user,
    replies: q.replies ? q.replies.map((r: any) => normalize(r)) : [],
  });
  return Array.isArray(raw) ? raw.map(normalize) : [];
}

export async function createQuestion(lessonId: number, content: string, parentId?: number | null) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSONS.QUESTIONS(lessonId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parentId }),
  });
  if (res.status === 401) throw new Error('UNAUTH');
  if (!res.ok) {
    const payload = await res.json().catch(async () => ({ error: await res.text().catch(() => '') }));
    const msg = payload?.error || payload?.message || '';
    throw new Error(msg || 'Failed to post question');
  }
  return res.json();
}

export async function deleteQuestion(lessonId: number, id: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LESSONS.QUESTIONS(lessonId)}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('UNAUTH');
  if (res.status === 403) throw new Error('FORBIDDEN');
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to delete question');
  }
  return res.json();
}

export function canModerateQuestion(user: CurrentUser | null | undefined) {
  return user?.role === 'admin' || user?.role === 'instructor';
}
