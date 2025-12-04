// components/CoursesFilterSection.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { usePublicCategories } from '@/lib/hooks/usePublicCategories';

export default function CoursesFilterSection() {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ]       = useState(sp.get('q') ?? '');
  const [cat, setCat]   = useState(sp.get('cat') ?? '');
  const [level, setLvl] = useState(sp.get('level') ?? '');
  const [sort, setSort] = useState(sp.get('sort') ?? 'popular');
  const { categories, loading, error } = usePublicCategories();

  const filterField = useMemo(
    () =>
      [
        // layout
        'w-full rounded-md px-3 py-2',
        // nền/viền/chữ: tối nhưng tương phản cao
        'bg-black/40 border border-white/12 text-gray-100 placeholder-gray-400',
        // focus rõ ràng
        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400',
        // hover nhẹ cho chuột
        'hover:border-white/25',
        // transition mượt
        'transition-colors',
      ].join(' '),
    []
  );

  function apply() {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (cat) p.set('cat', cat);
    if (level) p.set('level', level);
    if (sort) p.set('sort', sort);
    router.push('/courses?' + p.toString());
  }

  function resetAll() {
    setQ('');
    setCat('');
    setLvl('');
    setSort('popular');
    router.push('/courses');
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-4 rounded-xl bg-white/5 border border-white/10 mb-10 md:mb-12">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          aria-label="Search courses"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search courses…"
          className={filterField}
        />

        <select
          aria-label="Category"
          value={cat}
          onChange={e => setCat(e.target.value)}
          className={filterField}
        >
          <option value="">All categories</option>
          {categories.map((c)=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          aria-label="Level"
          value={level}
          onChange={e => setLvl(e.target.value)}
          className={filterField}
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <select
          aria-label="Sort by"
          value={sort}
          onChange={e => setSort(e.target.value)}
          className={filterField}
        >
          <option value="popular">Most popular</option>
          <option value="rating">Best rating</option>
          <option value="recent">Newest</option>
        </select>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {loading ? (
          <span className="text-xs text-white/60">Loading categories...</span>
        ) : null}
        {error ? (
          <span className="text-xs text-red-400">Khong tai duoc phan loai</span>
        ) : null}
        <button
          type="button"
          onClick={resetAll}
          className="rounded-md px-3 py-2 text-sm border border-white/15 hover:bg-white/10 transition"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={apply}
          className="rounded-md bg-white text-black px-4 py-2 hover:-translate-y-0.5 hover:shadow transition"
        >
          Apply
        </button>
      </div>

      {/* Tăng tương phản cho list option của select trên các trình duyệt hỗ trợ */}
      <style jsx global>{`
        select option {
          background: #0b0b0b;
          color: #f5f5f5;
        }
      `}</style>
    </section>
  );
}
