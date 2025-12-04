// lib/api-server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants';

const BASE_URL = API_BASE_URL;

/** Ghép Cookie header từ request hiện tại (Next 15: cookies() là async) */
async function cookieHeader(): Promise<string> {
  const store = await cookies();                // ✅ await
  const all = store.getAll();                   // ✅ có getAll() trên store
  return all.map(({ name, value }: { name: string; value: string }) =>
    `${name}=${value}`
  ).join('; ');
}

/** Check trạng thái enroll (server-side, forward cookie) */
export async function fetchEnrollmentStatusServer(courseId: number): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}${API_ENDPOINTS.ENROLLMENTS.STATUS(courseId)}`, {
      headers: { cookie: await cookieHeader() }, // ✅ forward cookie
      cache: 'no-store',
    });
    if (!res.ok) return false;                  // 401 → chưa đăng nhập
    const data = await res.json();
    return !!data.enrolled;
  } catch {
    return false;
  }
}


export async function fetchLessonDetailServer(id: number) {
  const res = await fetch(`${BASE_URL}/api/lessons/${id}`, {
    headers: { cookie: await cookieHeader() },   // 👈 forward Cookie
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch lesson (${res.status})`);
  return res.json(); // { id,title,blocks,resources,course:{...}, progress:{isCompleted,...} }
}

export async function fetchCourseOutlineServer(courseId: number) {
  const res = await fetch(`${BASE_URL}${API_ENDPOINTS.COURSES.BY_ID(courseId)}`, {
    headers: { cookie: await cookieHeader() },  // ✅
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch course outline (${res.status})`);
  return res.json();
}
