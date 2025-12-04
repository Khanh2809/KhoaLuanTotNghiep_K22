import 'server-only';
import { cookies } from 'next/headers';
import AdminCourseEditor from './AdminCourseEditor';

export const dynamic = 'force-dynamic';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function cookieHeader() {
  const jar = await cookies();
  return jar.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
}

async function fetchCourse(id: number) {
  const res = await fetch(`${API}/api/admin/courses/${id}`, {
    cache: 'no-store',
    headers: { cookie: await cookieHeader() },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(()=> '')}`);
  return res.json();
}

export default async function AdminCourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await fetchCourse(Number(id));
  return <AdminCourseEditor course={course} />;
}
