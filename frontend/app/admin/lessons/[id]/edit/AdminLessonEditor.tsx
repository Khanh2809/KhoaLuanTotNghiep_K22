'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Block = {
  id?: number;
  blockType: 'TEXT'|'VIDEO'|'EMBED'|'IMAGE'|'ATTACHMENT';
  displayOrder: number;
  textMarkdown?: string|null;
  videoUrl?: string|null;
  embedUrl?: string|null;
  imageUrl?: string|null; imageAlt?: string|null; caption?: string|null;
  fileUrl?: string|null;  videoDuration?: number|null;
};

function normalizeEmbedUrl(url: string) {
  if (!url) return url;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{6,})/i);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

export default function AdminLessonEditor({
  lessonId,
  initial,
}: {
  lessonId: number;
  initial: { title: string; description?: string | null; order: number; blocks: Block[] };
}) {
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [order, setOrder] = useState<number>(initial.order ?? 1);
  const [blocks, setBlocks] = useState<Block[]>(
    (initial.blocks ?? []).map((b, i) => ({ ...b, displayOrder: i + 1 }))
  );
  const [saving, setSaving] = useState(false);

  function addBlock(type: Block['blockType']) {
    setBlocks(prev => ([
      ...prev,
      { blockType: type, displayOrder: prev.length + 1, textMarkdown: type==='TEXT'?'':null,
        videoUrl: type==='VIDEO'? '':null, embedUrl: type==='EMBED'? '':null,
        imageUrl: type==='IMAGE'? '':null, imageAlt:null, caption:null, fileUrl:null, videoDuration:null }
    ]));
  }
  function removeBlock(idx:number) {
    setBlocks(prev => prev.filter((_,i)=>i!==idx).map((b,i)=>({ ...b, displayOrder: i+1 })));
  }

  async function save() {
    try {
      setSaving(true);
      const payload = {
        title, description, order,
        blocks: blocks.map(b => ({
          ...b,
          embedUrl: b.blockType==='EMBED' ? normalizeEmbedUrl(b.embedUrl || '') : b.embedUrl
        })),
      };
      const res = await fetch(`${BASE_URL}/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Đã lưu bài học');
    } catch (e:any) {
      toast.error(e.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  }

  return (
    <>
      {/* Meta nhỏ */}
      <div className="grid gap-3 md:grid-cols-[1fr,140px]">
        <div>
          <label className="mb-1 block text-sm text-white/80">Tiêu đề bài học</label>
          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="Tên bài học"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/80">Thứ tự</label>
          <input
            value={order}
            onChange={e=>setOrder(Number(e.target.value)||1)}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
            placeholder="1"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-sm text-white/80">Mô tả ngắn</label>
        <textarea
          value={description}
          onChange={e=>setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
          placeholder="Mô tả ngắn gọn nội dung bài…"
        />
      </div>

      {/* Toolbar thêm block */}
      <div className="my-4 flex flex-wrap gap-2">
        <button onClick={()=>addBlock('TEXT')} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">+ Văn bản</button>
        <button onClick={()=>addBlock('VIDEO')} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">+ Video</button>
        <button onClick={()=>addBlock('EMBED')} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">+ Nhúng</button>
        <button onClick={()=>addBlock('IMAGE')} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">+ Ảnh</button>
        <button onClick={()=>addBlock('ATTACHMENT')} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">+ Tệp</button>
      </div>

      {/* Danh sách block */}
      {blocks.map((b, idx) => (
        <div key={idx} className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <div className="inline-flex items-center gap-2">
              <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-xs">#{b.displayOrder}</span>
              <span className="text-white/80">{b.blockType}</span>
            </div>
            <button onClick={()=>removeBlock(idx)} className="rounded border border-white/15 px-2 py-1 text-sm hover:bg-white/10">
              Xoá
            </button>
          </div>

          {b.blockType==='TEXT' && (
            <textarea
              value={b.textMarkdown ?? ''}
              onChange={e=>setBlocks(x=>x.map((it,i)=> i===idx ? { ...it, textMarkdown:e.target.value } : it))}
              rows={10}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              placeholder="Markdown…"
            />
          )}

          {b.blockType==='VIDEO' && (
            <input
              value={b.videoUrl ?? ''}
              onChange={e=>setBlocks(x=>x.map((it,i)=> i===idx ? { ...it, videoUrl:e.target.value } : it))}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              placeholder="https://cdn.example.com/lesson.mp4"
            />
          )}

          {b.blockType==='EMBED' && (
            <input
              value={b.embedUrl ?? ''}
              onChange={e=>setBlocks(x=>x.map((it,i)=> i===idx ? { ...it, embedUrl:e.target.value } : it))}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              placeholder="https://www.youtube.com/watch?v=..."
              title="Tự chuẩn hoá sang dạng /embed khi lưu"
            />
          )}

          {b.blockType==='IMAGE' && (
            <div className="grid gap-2 md:grid-cols-3">
              <input
                value={b.imageUrl ?? ''} placeholder="Image URL"
                onChange={e=>setBlocks(x=>x.map((it,i)=> i===idx ? { ...it, imageUrl:e.target.value } : it))}
                className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              />
              <input
                value={b.imageAlt ?? ''} placeholder="Alt"
                onChange={e=>setBlocks(x=>x.map((it,i)=> i===idx ? { ...it, imageAlt:e.target.value } : it))}
                className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              />
              <input
                value={b.caption ?? ''} placeholder="Caption"
                onChange={e=>setBlocks(x=>x.map((it,i)=> i===idx ? { ...it, caption:e.target.value } : it))}
                className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
          )}

          {b.blockType==='ATTACHMENT' && (
            <input
              value={b.fileUrl ?? ''}
              onChange={e=>setBlocks(x=>x.map((it,i)=> i===idx ? { ...it, fileUrl:e.target.value } : it))}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-white outline-none focus:ring-2 focus:ring-blue-400/40"
              placeholder="https://cdn.example.com/file.pdf"
            />
          )}
        </div>
      ))}

      <button
        disabled={saving}
        onClick={save}
        className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
    </>
  );
}
