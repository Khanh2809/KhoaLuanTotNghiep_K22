'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function SummaryButton({ courseId }: { courseId: number }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadSummary() {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics/student/summary`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Tóm tắt thất bại');
      setSummary(payload.summary || '');
    } catch (e: any) {
      setSummary('');
      alert(e?.message || 'Tóm tắt thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur space-y-3">
      <div>
        <div className="text-sm font-semibold text-white">Tổng hợp phân tích</div>
        <div className="text-xs text-white/60">Tóm tắt ngắn gọn từ tiến độ và điểm số của bạn</div>
      </div>
      <button
        onClick={loadSummary}
        disabled={loading}
        className="inline-flex items-center rounded bg-white px-3 py-1.5 text-sm font-semibold text-black hover:-translate-y-0.5 transition disabled:opacity-60"
      >
        {loading ? 'Đang tóm tắt...' : 'Tổng hợp'}
      </button>
      {summary && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80 prose prose-invert max-w-none">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
