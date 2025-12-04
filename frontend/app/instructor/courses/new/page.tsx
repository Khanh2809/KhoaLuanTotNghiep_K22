'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import ThumbnailPicker from '@/components/ThumbnailPicker';
import { API_BASE_URL } from '@/lib/constants';
import { useCourseCategories } from '@/lib/hooks/useCourseCategories';

export default function NewCoursePage() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [thumb, setThumb] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const { categories, loading: loadingCategories, error: categoriesError } = useCourseCategories();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/instructor/courses`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: desc,
          thumbnailUrl: thumb || null,
          categoryId: categoryId === '' ? null : categoryId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Create failed');
      router.push(`/instructor/courses/${data.id}/edit`);
      toast.success('Đã tạo khóa học');
    } catch (e: any) {
      toast.error(e.message || 'Tạo khóa học thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Tạo khóa học</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded border border-white/10 bg-black/30 px-3 py-2"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
          className="w-full rounded border border-white/10 bg-black/30 px-3 py-2"
        />

        <div className="space-y-2">
          <label className="block text-sm text-white/80">Phân loại</label>
          <select
            value={categoryId === '' ? '' : String(categoryId)}
            onChange={(e) => {
              const v = e.target.value;
              setCategoryId(v ? Number(v) : '');
            }}
            className="w-full rounded border border-white/10 bg-black/30 px-3 py-2"
          >
            <option value="">Chưa phân loại</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {loadingCategories ? (
            <p className="text-xs text-white/60">Đang tải danh sánh phân loại...</p>
          ) : null}
          {categoriesError ? (
            <p className="text-xs text-red-400">Không tải được phân loại: {categoriesError}</p>
          ) : null}
        </div>

        <ThumbnailPicker
          value={thumb}
          onChange={setThumb}
          label="Ảnh bìa khóa học"
          helperText="Kéo thả từ thư mục, dán ảnh từ clipboard hoặc URL nếu cần"
        />
        <button disabled={saving} className="rounded bg-white px-4 py-2 text-black">
          {saving ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}
