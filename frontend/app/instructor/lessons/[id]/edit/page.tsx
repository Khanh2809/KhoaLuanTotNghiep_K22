// app/instructor/lessons/[id]/edit/page.tsx
import { cookies } from 'next/headers';
import Link from 'next/link';
import LessonEditor from './LessonEditor';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchLessonForEdit(id: number) {
  const jar = await cookies();
  const cookie = jar.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
  const res = await fetch(`${BASE_URL}/api/instructor/lessons/${id}`, {
    headers: { cookie },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export default async function LessonEditPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchLessonForEdit(Number(id)); // { id,title,description,order,blocks,... }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit lesson</h1>
        <Link
          href={`/instructor/courses/${data?.course?.id ?? ''}/quizzes/create?lessonId=${id}`}
          className="text-sm rounded bg-white text-black px-3 py-1.5"
        >
          Tạo Quiz cho bài này
        </Link>
      </div>
      {/* toàn bộ state/handlers sẽ ở client component */}
      <LessonEditor lessonId={Number(id)} initial={data} />
    </div>
  );
}
