// components/Testimonials.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Review = {
  name: string;
  role: string;
  text: string;
  stars: 4 | 5;
  avatar?: string;
};

const REVIEWS: Review[] = [
  {
    name: 'Dương Quang',
    role: 'Học viên',
    stars: 4,
    text:
      'Lộ trình gợi ý giữ mình đi đúng hướng. Bài ngắn + quiz giúp hiểu cốt lõi nhanh, gợi ý AI rất tự nhiên.',
  },
  {
    name: 'Minh Nguyễn',
    role: 'Học viên',
    stars: 4,
    text:
      'Sau lớp React cơ bản mình làm được mini-project. Bài tập xếp đúng thứ tự nên lúc nào cũng biết bước tiếp theo.',
  },
  {
    name: 'Dung Trần',
    role: 'Phụ huynh',
    stars: 5,
    text:
      'Dashboard rõ ràng, con tự theo dõi tiến độ. Mình xem được thời gian học và kết quả quiz rất nhanh.',
  },
  {
    name: 'Minh Phúc',
    role: 'Học viên',
    stars: 5,
    text:
      'Từ vựng TOEIC theo từng chủ đề, quiz cuối mỗi phần phản hồi ngay nên nhớ rất lâu.',
  },
  {
    name: 'Anh Thư',
    role: 'Nhân viên văn phòng',
    stars: 4,
    text:
      'Mình học SQL để viết báo cáo. Bài ngắn gọn, phần thực hành chạy ngay trên trình duyệt nên tiết kiệm thời gian.',
  },
  {
    name: 'Hoài Nam',
    role: 'Học viên',
    stars: 5,
    text:
      'Giải thích sau khi nộp bài rất giá trị—vì sao sai và sửa thế nào. Tiến bộ nhanh hơn hẳn.',
  },
  {
    name: 'Bảo Châu',
    role: 'Phụ huynh',
    stars: 4,
    text:
      'Con thích thang thử thách tuần. Mình xem báo cáo hoạt động và xuất ghi chú học tập rất tiện.',
  },
  {
    name: 'Vân Hằng',
    role: 'Sinh viên',
    stars: 5,
    text:
      'Lộ trình JS + React + Next.js mạch lạc, có project. Mình xin được internship nhờ portfolio xây ở đây.',
  },
  {
    name: 'Khánh Linh',
    role: 'Giảng viên',
    stars: 4,
    text:
      'Tài nguyên TOEIC được chọn lọc, dễ giao bài. Có thể xuất danh sách từ vựng theo chủ đề để dùng trên lớp.',
  },
  {
    name: 'Hoàng Long',
    role: 'Học viên',
    stars: 5,
    text:
      'AI phân tích khái niệm khó bằng ví dụ dễ hiểu. Câu trả lời bám sát bài mình đang học nên không bị phân tâm.',
  },
];

function InitialAvatar({ name }: { name: string }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    const s = (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
    return s.toUpperCase();
  }, [name]);

  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return h % 360;
  }, [name]);

  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
      style={{ background: `hsl(${hue} 70% 45% / 0.95)` }}
      aria-hidden
    >
      {initials || '?'}
    </div>
  );
}

function Stars({ n }: { n: 4 | 5 }) {
  return (
    <div className="inline-flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i < n ? 'fill-yellow-400' : 'fill-white/15'}`}>
          <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [page, setPage] = useState(0);

  // responsive items per slide: 1 / 2 / 3
  const perPage = useMemo(() => {
    if (typeof window === 'undefined') return 3;
    const w = window.innerWidth;
    if (w < 768) return 1;
    if (w < 1024) return 2;
    return 3;
  }, []);

  const pages = Math.max(1, Math.ceil(REVIEWS.length / perPage));

  // Auto-play
  useEffect(() => {
    const t = setInterval(() => setPage((p) => (p + 1) % pages), 5000);
    return () => clearInterval(t);
  }, [pages]);

  const start = page * perPage;
  const slice = REVIEWS.slice(start, start + perPage);

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-14 md:py-16">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight md:text-4xl">Người học nói gì</h2>
        <p className="text-white/70">Phản hồi thực tế từ học viên, giảng viên và người đi làm.</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {slice.map((r, i) => (
          <article
            key={start + i}
            className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgb(255_255_255_/_0.04)_inset] backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
          >
            <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-white/5 blur-2xl" />
            <div className="flex items-center justify-between">
              <Stars n={r.stars} />
              <span className="text-4xl leading-none text-white/20">“</span>
            </div>
            <p className="mt-3 text-white/90">{r.text}</p>

            <div className="mt-5 flex items-center gap-3">
              <InitialAvatar name={r.name} />
              <div>
                <div className="font-medium text-white">{r.name}</div>
                <div className="text-xs text-white/60">{r.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            aria-label={`Page ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition ${i === page ? 'bg-white' : 'bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  );
}
