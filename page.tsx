import Link from 'next/link';
import { cookies } from 'next/headers';
import { fetchLearningPathDetail } from '@/lib/api';
import EnrollPathButton from '@/components/EnrollPathButton';
import { ArrowLeft, BookOpen, Route } from 'lucide-react';

type Params = { id: string };

export default async function LearningPathDetail({ params }: { params: Params }) {
  const { id } = params;
  const cookie = cookies().toString();
  const detail = await fetchLearningPathDetail(Number(id), cookie).catch(() => null);

  if (!detail) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-white/70">Khong tai duoc lo trinh.</div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/learning-paths" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Quay lai
        </Link>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Route className="h-4 w-4" /> Lo trinh
            </p>
            <h1 className="text-3xl font-bold text-white">{detail.title}</h1>
            {detail.description && <p className="text-sm text-white/70 max-w-3xl">{detail.description}</p>}
          </div>
          <EnrollPathButton pathId={detail.id} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Cac khoa trong lo trinh</h2>
        <div className="grid gap-3">
          {detail.items?.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3 text-white">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">{it.order}</span>
                <div>
                  <div className="text-base font-semibold">{it.courseTitle}</div>
                  {it.status && <p className="text-xs text-white/60">Trang thai: {it.status}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href={it.courseSlug ? `/courses/${it.courseSlug}` : `/courses/${it.courseId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-white/80 hover:border-white/30 hover:text-white"
                >
                  <BookOpen className="h-4 w-4" /> Xem khoa
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
