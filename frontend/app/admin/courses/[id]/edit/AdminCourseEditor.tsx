'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL, COURSE_STATUS } from '@/lib/constants';

export default function AdminCourseEditor({ course }: { course: any }) {
  const [meta, setMeta] = useState({
    title: course.title || '',
    description: course.description || '',
    thumbnailUrl: course.thumbnailUrl || '',
    status: course.status || 'DRAFT',
  });
  const [modules, setModules] = useState<any[]>(course.modules || []);
  const [savingMeta, setSavingMeta] = useState(false);

  async function saveMeta() {
    try {
      setSavingMeta(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/courses/${course.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(meta),
      });
      if (!res.ok) {
        const message = await res.text();
        toast.error(message || 'Không thể lưu khoá học');
      } else {
        toast.success('Đã lưu thông tin khoá học');
      }
    } finally {
      setSavingMeta(false);
    }
  }

  async function addModule() {
    const title = prompt('Tên phần (module)', 'Phần mới') ?? 'Phần mới';
    const res = await fetch(`${API_BASE_URL}/api/admin/courses/${course.id}/modules`, {
      method: 'POST', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title }),
    });
    const m = await res.json();
    if (!res.ok) {
      toast.error(m?.error || 'Thêm phần thất bại');
      return;
    }
    setModules((arr)=> [...arr, { ...m, lessons: [] }]);
    toast.success('Đã thêm phần mới');
  }

  async function addLesson(mid:number) {
    const title = prompt('Tên bài học', 'Bài học mới') ?? 'Bài học mới';
    const res = await fetch(`${API_BASE_URL}/api/admin/modules/${mid}/lessons`, {
      method: 'POST', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title }),
    });
    const ls = await res.json();
    if (!res.ok) {
      toast.error(ls?.error || 'Thêm bài học thất bại');
      return;
    }
    setModules(ms => ms.map(m => m.id===mid ? { ...m, lessons: [...m.lessons, ls] } : m));
    toast.success('Đã thêm bài học');
  }

  async function renameModule(m: any, title: string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/modules/${m.id}`, {
      method: 'PUT', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const message = await res.text();
      toast.error(message || 'Đổi tên phần thất bại');
    }
  }

  async function deleteModule(mid:number) {
    if (!confirm('Xoá phần này?')) return;
    const res = await fetch(`${API_BASE_URL}/api/admin/modules/${mid}`, { method:'DELETE', credentials:'include' });
    if (!res.ok) {
      const message = await res.text();
      toast.error(message || 'Xoá phần thất bại');
      return;
    }
    setModules(ms => ms.filter(x=>x.id!==mid));
    toast.success('Đã xoá phần');
  }

  async function renameLesson(ls:any, title:string) {
    const res = await fetch(`${API_BASE_URL}/api/admin/lessons/${ls.id}`, {
      method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const message = await res.text();
      toast.error(message || 'Đổi tên bài học thất bại');
    }
  }

  async function deleteLesson(m:any, ls:any) {
    if (!confirm('Xoá bài học này?')) return;
    const res = await fetch(`${API_BASE_URL}/api/admin/lessons/${ls.id}`, { method:'DELETE', credentials:'include' });
    if (!res.ok) {
      const message = await res.text();
      toast.error(message || 'Xoá bài học thất bại');
      return;
    }
    setModules(ms => ms.map(mm => mm.id===m.id ? { ...mm, lessons: mm.lessons.filter((x:any)=>x.id!==ls.id) } : mm));
    toast.success('Đã xoá bài học');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Chỉnh sửa khoá học</h1>

      {/* Meta */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4 md:p-5 space-y-3">
        <div>
          <label className="mb-1 block text-sm text-white/80">Tiêu đề</label>
          <input
            value={meta.title}
            onChange={e=>setMeta({...meta, title:e.target.value})}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="Tên khoá học"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Mô tả</label>
          <textarea
            value={meta.description||''}
            onChange={e=>setMeta({...meta, description:e.target.value})}
            rows={5}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="Tóm tắt nội dung, mục tiêu học tập…"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Ảnh minh hoạ (URL)</label>
          <input
            value={meta.thumbnailUrl||''}
            onChange={e=>setMeta({...meta, thumbnailUrl:e.target.value})}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="https://cdn.example.com/cover.png"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/80">Trạng thái</label>
          <select
            value={meta.status}
            onChange={e=>setMeta({...meta, status:e.target.value as any})}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
          >
            <option value={COURSE_STATUS.DRAFT}>Bản nháp</option>
            <option value={COURSE_STATUS.PUBLISHED}>Đã xuất bản</option>
          </select>
          <p className="mt-1 text-xs text-white/50">* Giá trị gửi lên API vẫn là DRAFT/PUBLISHED.</p>
        </div>

        <div className="pt-2">
          <button
            onClick={saveMeta}
            disabled={savingMeta}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {savingMeta ? 'Đang lưu…' : 'Lưu thông tin'}
          </button>
        </div>
      </div>

      {/* Outline */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Đề cương</h2>
          <button onClick={addModule} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10">
            + Phần (Module)
          </button>
        </div>

        <div className="space-y-4">
          {modules.map(m => (
            <div key={m.id} className="overflow-hidden rounded-xl border border-white/10">
              <div className="flex items-center justify-between px-3 py-2 bg-white/5">
                <input
                  defaultValue={m.title}
                  onBlur={e=>renameModule(m, e.currentTarget.value)}
                  className="bg-transparent outline-none text-white font-medium"
                  title="Nhấn để sửa tên phần, rời focus để lưu"
                />
                <div className="flex gap-2">
                  <button onClick={()=>addLesson(m.id)} className="text-sm rounded border border-white/15 px-2 py-1 hover:bg-white/10">
                    + Bài học
                  </button>
                  <button onClick={()=>deleteModule(m.id)} className="text-sm text-red-400 hover:text-red-300">
                    Xoá
                  </button>
                </div>
              </div>

              <ul className="divide-y divide-white/10">
                {m.lessons.map((ls:any)=>(
                  <li key={ls.id} className="flex items-center justify-between px-3 py-2">
                    <input
                      defaultValue={ls.title}
                      onBlur={e=>renameLesson(ls, e.currentTarget.value)}
                      className="bg-transparent outline-none text-white/90"
                      title="Nhấn để sửa tên bài, rời focus để lưu"
                    />
                    <div className="flex gap-2">
                      <a href={`/admin/lessons/${ls.id}/edit`} className="text-sm text-blue-400 hover:underline">Sửa nội dung</a>
                      <button onClick={()=>deleteLesson(m, ls)} className="text-sm text-red-400 hover:text-red-300">Xoá</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {modules.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/60">
              Chưa có phần nào. Nhấn “+ Phần (Module)” để bắt đầu tạo đề cương.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
