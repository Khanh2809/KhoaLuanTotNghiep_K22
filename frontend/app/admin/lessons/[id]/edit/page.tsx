import 'server-only';
import { cookies } from 'next/headers';
import AdminLessonEditor from './AdminLessonEditor';

export const dynamic = 'force-dynamic';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Admin có quyền truy cập GET instructor lessons (route đã cho phép role 'admin').
async function cookieHeader() {
  const jar = await cookies();
  return jar.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
}

async function fetchLesson(id:number) {
  const res = await fetch(`${API}/api/instructor/lessons/${id}`, {
    cache: 'no-store',
    headers: { cookie: await cookieHeader() },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(()=> '')}`);
  return res.json();
}

export default async function AdminLessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchLesson(Number(id));
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Chỉnh sửa bài học</h1>
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4 md:p-5">
        <AdminLessonEditor lessonId={Number(id)} initial={data} />
      </div>
    </div>
  );
}
