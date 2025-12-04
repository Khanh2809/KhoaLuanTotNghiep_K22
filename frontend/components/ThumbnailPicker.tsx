'use client';

import type { ClipboardEvent, DragEvent } from 'react';
import { useCallback, useRef, useState } from 'react';

type Props = {
  value?: string;
  onChange: (val: string) => void;
  label?: string;
  helperText?: string;
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ThumbnailPicker({
  value = '',
  onChange,
  label = 'Anh bia',
  helperText = 'Keo tha tu thu muc, dan anh tu clipboard hoac nhap URL neu can.',
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Chi nhan file anh (jpg, png, webp...)');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const content = await readFile(file);
        onChange(content);
      } catch (e) {
        setError('Doc file that bai. Thu lai nhe.');
      } finally {
        setLoading(false);
      }
    },
    [onChange]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      handleFile(files[0]);
    },
    [handleFile]
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const img = Array.from(e.clipboardData.files || []).find((f) => f.type.startsWith('image/'));
    if (img) {
      e.preventDefault();
      handleFile(img);
    }
  };

  const urlValue = !value || value.startsWith('data:') ? '' : value;

  return (
    <div className="space-y-2">
      {label ? <label className="block text-sm text-white/80">{label}</label> : null}
      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onPaste={onPaste}
        className={`rounded-xl border px-4 py-3 transition ${
          dragging ? 'border-blue-400/60 bg-blue-500/10' : 'border-white/10 bg-black/30'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="h-24 w-36 overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {value ? (
              <img src={value} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/50">
                Drop anh vao day
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm text-white/80">
              Keo tha/ dan anh tu clipboard hoac bam de chon file.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black shadow hover:-translate-y-0.5 transition"
              >
                {loading ? 'Dang xu ly...' : 'Chon anh'}
              </button>
              {value ? (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10"
                >
                  Xoa anh
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            <input
              type="url"
              value={urlValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Hoac dan URL anh (tuy chon)"
              className="w-full rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-blue-400/50"
            />

            <p className="text-xs text-white/60">{helperText}</p>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
