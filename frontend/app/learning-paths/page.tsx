import Link from 'next/link';
import { fetchLearningPaths } from '@/lib/api';
import { ArrowRight, Route, Users } from 'lucide-react';

export const revalidate = 60;

export default async function LearningPathsPage() {
  const paths = await fetchLearningPaths().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Route className="h-4 w-4" /> Lo trinh hoc
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Kham pha lo trinh</h1>
          <p className="text-sm text-white/70">Cac khoa hoc theo thu tu, giup hoc vien di tu nen tang den nang cao.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {paths.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">Chua co lo trinh.</div>
        )}
        {paths.map((p) => (
          <Link
            key={p.id}
            href={`/learning-paths/${p.id}`}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{p.title}</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase text-white/70">
                  {p.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              {p.description && <p className="text-sm text-white/70">{p.description}</p>}
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-1"><Route className="h-3.5 w-3.5" /> {p.courseCount ?? 0} khoa</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.enrollmentCount ?? 0} hoc vien</span>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
              Xem chi tiet <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
