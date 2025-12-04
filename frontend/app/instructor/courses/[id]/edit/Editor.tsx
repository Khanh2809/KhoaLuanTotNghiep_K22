'use client';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { API_BASE_URL, COURSE_STATUS } from '@/lib/constants';
import ThumbnailPicker from '@/components/ThumbnailPicker';
import { useCourseCategories } from '@/lib/hooks/useCourseCategories';

type MetaState = {
  title: string;
  description: string;
  thumbnailUrl: string;
  status: string;
  categoryId: number | null;
};

export default function Editor({ course }: { course: any }) {
  const [meta, setMeta] = useState<MetaState>({
    title: course.title || '',
    description: course.description || '',
    thumbnailUrl: course.thumbnailUrl || '',
    status: course.status || COURSE_STATUS.DRAFT,
    categoryId: course.categoryId ?? course.category?.id ?? null,
  });
  const [modules, setModules] = useState<any[]>(course.modules || []);
  const { categories, loading: loadingCategories, error: categoriesError } = useCourseCategories();

  async function saveMeta() {
    const payload = {
      ...meta,
      categoryId: meta.categoryId ?? null,
    };
    const res = await fetch(`${API_BASE_URL}/api/instructor/courses/${course.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast.error('Lưu thông tin khoá học thất bại');
      return;
    }
    toast.success('Đã lưu thông tin khoá học');
  }

  async function addModule() {
    const res = await fetch(`${API_BASE_URL}/api/instructor/courses/${course.id}/modules`, {
      method: 'POST', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title: 'New module' }),
    });
    const m = await res.json();
    setModules((arr)=> [...arr, { ...m, lessons: [] }]);
    toast.success('Đã thêm phần mới');
  }

  async function addLesson(mid:number) {
    const res = await fetch(`${API_BASE_URL}/api/instructor/modules/${mid}/lessons`, {
      method: 'POST', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title: 'New lesson' }),
    });
    const ls = await res.json();
    setModules(ms => ms.map(m => m.id===mid ? { ...m, lessons: [...m.lessons, ls] } : m));
    toast.success('Đã thêm bài học');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit course</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/instructor/courses/${course.id}/quizzes`}
            className="text-sm rounded border border-white/15 px-3 py-1.5 hover:bg-white/10"
          >
            Quản lý Quiz
          </Link>
          <Link
            href={`/instructor/courses/${course.id}/quizzes/create`}
            className="text-sm rounded bg-white text-black px-3 py-1.5"
          >
            Tạo Quiz
          </Link>
        </div>
      </div>

      {/* Meta */}
      <div className="rounded border border-white/10 p-4 space-y-3">
        <input
          value={meta.title}
          onChange={e=>setMeta({...meta, title:e.target.value})}
          className="w-full rounded border border-white/10 bg-black/30 px-3 py-2"
          placeholder="Title"
        />
        <textarea
          value={meta.description||''}
          onChange={e=>setMeta({...meta, description:e.target.value})}
          className="w-full rounded border border-white/10 bg-black/30 px-3 py-2"
          placeholder="Description"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm text-white/80">Phan loai</label>
            <select
              value={meta.categoryId === null ? '' : String(meta.categoryId)}
              onChange={(e)=>setMeta({...meta, categoryId: e.target.value ? Number(e.target.value) : null})}
              className="w-full rounded border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="">Chua phan loai</option>
              {categories.map((c)=>(
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {loadingCategories ? (
              <p className="text-xs text-white/60">Dang tai phan loai...</p>
            ) : null}
            {categoriesError ? (
              <p className="text-xs text-red-400">Khong tai duoc phan loai: {categoriesError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-white/80">Trang thai</label>
            <select
              value={meta.status}
              onChange={e=>setMeta({...meta, status:e.target.value as any})}
              className="w-full rounded border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value={COURSE_STATUS.DRAFT}>Draft</option>
              <option value={COURSE_STATUS.PUBLISHED}>Published</option>
            </select>
          </div>
        </div>

        <ThumbnailPicker
          value={meta.thumbnailUrl||''}
          onChange={(val)=>setMeta({...meta, thumbnailUrl: val})}
          label="Anh bia khoa hoc"
          helperText="Keo tha anh tu thu muc, dan anh tu clipboard hoac nhap URL neu can."
        />
        <button onClick={saveMeta} className="rounded bg-white text-black px-4 py-2">Save</button>
      </div>

      {/* Outline */}
      <div className="rounded border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Outline</h2>
          <button onClick={addModule} className="rounded border border-white/15 px-3 py-1.5">+ Module</button>
        </div>

        <div className="space-y-4">
          {modules.map(m => (
            <div key={m.id} className="rounded border border-white/10">
              <div className="flex items-center justify-between px-3 py-2 bg-white/5">
                <input
                  defaultValue={m.title}
                  onBlur={async e=>{
                    const title = e.currentTarget.value;
                    await fetch(`${API_BASE_URL}/api/instructor/modules/${m.id}`, {
                      method: 'PATCH', credentials:'include', headers:{'Content-Type':'application/json'},
                      body: JSON.stringify({ title })
                    });
                  }}
                  className="bg-transparent outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={()=>addLesson(m.id)} className="text-sm rounded border border-white/15 px-2 py-1">+ Lesson</button>
                  <button
                    onClick={async ()=>{
                      await fetch(`${API_BASE_URL}/api/instructor/modules/${m.id}`, { method:'DELETE', credentials:'include' });
                      setModules(ms => ms.filter(x=>x.id!==m.id));
                      toast.success('Đã xoá phần');
                    }}
                    className="text-sm text-red-400">Delete</button>
                </div>
              </div>

              {/* lessons */}
              <ul className="divide-y divide-white/10">
                {m.lessons.map((ls:any)=>(
                  <li key={ls.id} className="flex items-center justify-between px-3 py-2">
                    <input
                      defaultValue={ls.title}
                      onBlur={async e=>{
                        const title = e.currentTarget.value;
                        await fetch(`${API_BASE_URL}/api/instructor/lessons/${ls.id}`, {
                          method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({ title })
                        });
                      }}
                      className="bg-transparent outline-none"
                    />
                    <div className="flex gap-2">
                      <a href={`/instructor/lessons/${ls.id}/edit`} className="text-sm text-blue-500 hover:underline">Edit content</a>
                      <button
                        onClick={async ()=>{
                          await fetch(`${API_BASE_URL}/api/instructor/lessons/${ls.id}`, { method:'DELETE', credentials:'include' });
                          setModules(ms => ms.map(mm => mm.id===m.id ? { ...mm, lessons: mm.lessons.filter((x:any)=>x.id!==ls.id) } : mm));
                          toast.success('Đã xoá bài học');
                        }}
                        className="text-sm text-red-400">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
