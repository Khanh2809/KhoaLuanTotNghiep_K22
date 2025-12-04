import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';

export type ReviewItem = {
  id: number;
  rating: number;
  review?: string | null;
  createdAt?: string;
  user?: { id: number; name?: string | null; email?: string | null };
};

export async function fetchReviews(courseId: number): Promise<ReviewItem[]> {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REVIEWS}?courseId=${courseId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load reviews');
  return res.json();
}

export async function submitReview(courseId: number, rating: number, review: string) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REVIEWS}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, rating, review }),
  });
  if (res.status === 401) throw new Error('UNAUTH');
  if (!res.ok) {
    const payload = await res.json().catch(async () => ({ error: await res.text().catch(() => '') }));
    const msg = payload?.error || payload?.message || '';
    throw new Error(msg || 'Failed to submit review');
  }
  return res.json();
}

export async function deleteReview(id: number) {
  const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REVIEWS}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('UNAUTH');
  if (res.status === 403) throw new Error('FORBIDDEN');
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Failed to delete review');
  }
  return res.json();
}
