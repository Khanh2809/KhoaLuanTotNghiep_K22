'use client';
import { useEffect, useState } from 'react';
import { markLessonProgress } from '@/lib/api';
import { CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function MarkCompleteButton({
  lessonId,
  initialCompleted = false,
}: { lessonId: number; initialCompleted?: boolean }) {
  const [done, setDone] = useState(!!initialCompleted);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDone(!!initialCompleted);
  }, [lessonId, initialCompleted]);

  async function toggle() {
    try {
      setSaving(true);
      const next = !done;
      setDone(next);                 // optimistic
      await markLessonProgress(lessonId, next); // persist
    } catch (e) {
      setDone(prev => !prev);        // rollback
      console.error(e);
      toast.error('Không thể cập nhật tiến độ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      aria-pressed={done}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition
        ${done
          ? 'border-green-500/40 bg-green-500/15 text-green-200'
          : 'border-white/15 bg-white/5 text-white hover:bg-white/10'} 
        ${saving ? 'opacity-70' : ''}`}
      title={done ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
    >
      {saving ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
      ) : done ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {saving ? 'Đang lưu…' : done ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
    </button>
  );
}
