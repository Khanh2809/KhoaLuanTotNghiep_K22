'use client';
import { useMemo, useState } from 'react';
import { MOCK_COURSES } from '@/mocks/courses';
import { CATEGORIES } from '@/mocks/categories';

type Props = { onResults: (ids: number[]) => void };

export default function SearchWithFilters({ onResults }: Props) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [level, setLevel] = useState<string>(''); // placeholder

  // cache đơn giản bằng useMemo
  const results = useMemo(() => {
    const filtered = MOCK_COURSES.filter(c => {
      const okQ = !q || c.title.toLowerCase().includes(q.toLowerCase());
      const okCat = !category || c.category === category;
      const okLevel = !level || true; // chưa có field level trong mock
      return okQ && okCat && okLevel;
    });
    return filtered.map(c => c.id);
  }, [q, category, level]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 rounded-xl bg-white/5 border border-white/10">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Search courses…"
          className="rounded-md border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={category}
          onChange={(e)=>setCategory(e.target.value)}
          className="rounded-md border border-white/10 bg-black/30 px-3 py-2"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select
          value={level}
          onChange={(e)=>setLevel(e.target.value)}
          className="rounded-md border border-white/10 bg-black/30 px-3 py-2"
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={()=>onResults(results)}
          className="rounded-md bg-white text-black px-4 py-2 hover:-translate-y-0.5 hover:shadow transition"
        >
          Search
        </button>
      </div>
    </div>
  );
}
