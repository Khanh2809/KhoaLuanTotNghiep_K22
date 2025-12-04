// components/WhyChooseSelfStudy.tsx
'use client';

import type { ReactNode } from 'react';
import { Lightbulb, Rocket, ShieldCheck, Brain, Clock, Sparkles } from 'lucide-react';

type Reason = { icon: ReactNode; title: string; desc: string };

const REASONS: Reason[] = [
  {
    icon: <Lightbulb className="h-5 w-5 text-amber-300" />,
    title: 'Lộ trình cá nhân',
    desc: 'Điều chỉnh theo mục tiêu và nhịp học bạn chọn.',
  },
  {
    icon: <Brain className="h-5 w-5 text-cyan-200" />,
    title: 'Hiểu sâu, nhớ lâu',
    desc: 'Bài ngắn, checkpoint và recap thông minh giúp giữ kiến thức.',
  },
  {
    icon: <Clock className="h-5 w-5 text-sky-300" />,
    title: 'Học đúng giờ của bạn',
    desc: 'Tạm dừng/tiếp tục linh hoạt, nhắc nhở vừa đủ để giữ streak.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-emerald-300" />,
    title: 'An toàn & tin cậy',
    desc: 'Giảng viên uy tín, không gian bảo mật, chấm điểm minh bạch.',
  },
  {
    icon: <Rocket className="h-5 w-5 text-fuchsia-300" />,
    title: 'Kỹ năng đi làm',
    desc: 'Project và checkpoint để bạn tự tin triển khai thực tế.',
  },
  {
    icon: <Sparkles className="h-5 w-5 text-indigo-200" />,
    title: 'Trải nghiệm mượt mà',
    desc: 'Tối ưu tốc độ và tập trung trên cả desktop lẫn mobile.',
  },
];

export default function WhyChooseSelfStudy({
  title = 'Vì sao người học chọn PotatoEdu',
  subtitle = 'Mỗi module được thiết kế để rõ ràng, giữ nhịp và đo được kết quả.',
}: { title?: string; subtitle?: string }) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-14 md:py-16">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
        <p className="mx-auto max-w-2xl text-white/70">{subtitle}</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r, i) => (
          <article
            key={i}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent p-5 backdrop-blur transition hover:-translate-y-1 hover:border-white/25 hover:shadow-2xl"
          >
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white">
              {r.icon}
              <span className="text-sm font-semibold">Highlight</span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-white">{r.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">{r.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
