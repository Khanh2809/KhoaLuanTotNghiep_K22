'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';

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
  // If user pasted full iframe, extract src
  if (url.includes('<iframe')) {
    const m = url.match(/src=["']([^"']+)["']/i);
    url = m?.[1] || url;
  }
  // Normalize common YouTube watch/share -> embed
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\\?v=)([\\w-]{6,})/i);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url.trim();
}

export default function LessonEditor({
  lessonId,
  initial,
}: {
  lessonId: number;
  initial: {
    title: string;
    description?: string | null;
    order: number;
    blocks: Block[];
  };
}) {
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [order, setOrder] = useState<number>(initial.order ?? 1);
  const [blocks, setBlocks] = useState<Block[]>(
    (initial.blocks ?? []).map((b, i) => ({ ...b, displayOrder: i + 1 }))
  );
  const [saving, setSaving] = useState(false);

  function addBlock(type: Block['blockType']) {
    setBlocks(prev => [
      ...prev,
      {
        blockType: type,
        displayOrder: prev.length + 1,
        textMarkdown: type === 'TEXT' ? '' : null,
        videoUrl:     type === 'VIDEO' ? '' : null,
        embedUrl:     type === 'EMBED' ? '' : null,
        imageUrl:     type === 'IMAGE' ? '' : null,
        imageAlt: null, caption: null, fileUrl: null, videoDuration: null,
      },
    ]);
  }

  function removeBlock(idx: number) {
    setBlocks(prev =>
      prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, displayOrder: i + 1 }))
    );
  }

  async function save() {
    try {
      setSaving(true);
      const payload = {
        title,
        description,
        order,
        blocks: blocks.map(b => ({
          ...b,
          embedUrl:
            b.blockType === 'EMBED' ? normalizeEmbedUrl(b.embedUrl || '') : b.embedUrl,
        })),
      };
      const res = await fetch(`${API_BASE_URL}/api/instructor/lessons/${lessonId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }
      toast.success('Đã lưu bài học');
    } catch (e: any) {
      toast.error(e?.message || 'Lưu bài học thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[1fr,160px]">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="rounded border border-white/10 bg-black/20 px-3 py-2"
          placeholder="Title"
        />
        <input
          value={order}
          onChange={e => setOrder(Number(e.target.value) || 1)}
          className="rounded border border-white/10 bg-black/20 px-3 py-2"
          placeholder="Order"
        />
      </div>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={5}
        className="mt-3 w-full rounded border border-white/10 bg-black/20 px-3 py-2"
        placeholder="Description"
      />

      {/* Toolbar */}
      <div className="flex gap-2 my-4">
        <button type="button" onClick={() => addBlock('TEXT')} className="rounded border px-3 py-1.5">+ Text</button>
        <button type="button" onClick={() => addBlock('VIDEO')} className="rounded border px-3 py-1.5">+ Video</button>
        <button type="button" onClick={() => addBlock('EMBED')} className="rounded border px-3 py-1.5">+ Embed</button>
        <button type="button" onClick={() => addBlock('IMAGE')} className="rounded border px-3 py-1.5">+ Image</button>
        <button type="button" onClick={() => addBlock('ATTACHMENT')} className="rounded border px-3 py-1.5">+ File</button>
      </div>

      {/* Block editors */}
      {blocks.map((b, idx) => (
        <div key={idx} className="rounded border border-white/10 p-3 mb-3">
          <div className="flex items-center justify-between text-sm opacity-70 mb-2">
            <div>#{b.displayOrder} — {b.blockType}</div>
            <button type="button" onClick={() => removeBlock(idx)} className="px-2 py-1 border rounded">Remove</button>
          </div>

          {b.blockType === 'TEXT' && (
            <textarea
              value={b.textMarkdown ?? ''}
              onChange={e =>
                setBlocks(x => x.map((it, i) => (i === idx ? { ...it, textMarkdown: e.target.value } : it)))
              }
              rows={10}
              className="w-full rounded border border-white/10 bg-black/20 p-2"
              placeholder="Markdown…"
            />
          )}

          {b.blockType === 'VIDEO' && (
            <input
              value={b.videoUrl ?? ''}
              onChange={e => setBlocks(x => x.map((it, i) => (i === idx ? { ...it, videoUrl: e.target.value } : it)))}
              className="w-full rounded border border-white/10 bg-black/20 p-2"
              placeholder="https://cdn.example.com/lesson.mp4"
            />
          )}

          {b.blockType === 'EMBED' && (
            <div className="flex items-center gap-2">
              <input
                value={b.embedUrl ?? ''}
                onChange={e => setBlocks(x => x.map((it, i) => (i === idx ? { ...it, embedUrl: e.target.value } : it)))}
                className="w-full rounded border border-white/10 bg-black/20 p-2"
                placeholder="https://www.youtube.com/watch?v=... hoặc dán iframe"
              />
              <button
                type="button"
                onClick={() =>
                  setBlocks(x =>
                    x.map((it, i) => (i === idx ? { ...it, embedUrl: normalizeEmbedUrl(it.embedUrl || '') } : it))
                  )
                }
                className="shrink-0 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Làm sạch
              </button>
            </div>
          )}

          {b.blockType === 'IMAGE' && (
            <div className="grid gap-2">
              <input
                value={b.imageUrl ?? ''}
                placeholder="Image URL"
                onChange={e => setBlocks(x => x.map((it, i) => (i === idx ? { ...it, imageUrl: e.target.value } : it)))}
                className="w-full rounded border border-white/10 bg-black/20 p-2"
              />
              <input
                value={b.imageAlt ?? ''}
                placeholder="Alt"
                onChange={e => setBlocks(x => x.map((it, i) => (i === idx ? { ...it, imageAlt: e.target.value } : it)))}
                className="w-full rounded border border-white/10 bg-black/20 p-2"
              />
              <input
                value={b.caption ?? ''}
                placeholder="Caption"
                onChange={e => setBlocks(x => x.map((it, i) => (i === idx ? { ...it, caption: e.target.value } : it)))}
                className="w-full rounded border border-white/10 bg-black/20 p-2"
              />
            </div>
          )}

          {b.blockType === 'ATTACHMENT' && (
            <input
              value={b.fileUrl ?? ''}
              onChange={e => setBlocks(x => x.map((it, i) => (i === idx ? { ...it, fileUrl: e.target.value } : it)))}
              className="w-full rounded border border-white/10 bg-black/20 p-2"
              placeholder="https://cdn.example.com/file.pdf"
            />
          )}
        </div>
      ))}

      <button type="button" disabled={saving} onClick={save} className="rounded bg-white text-black px-4 py-2">
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </>
  );
}
