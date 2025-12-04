import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, BookOpen, CheckCircle2, LineChart } from 'lucide-react';

const learningNow = {
  title: 'Luyện nghe TOEIC 700+',
  progress: 72,
  completedLessons: 18,
  totalLessons: 25,
  nextAction: 'Làm bài nghe Part 3 - 15 phút',
};

const featuredCourses = [
  {
    title: 'Toeic nền tảng 450+',
    tag: 'Lộ trình 6 tuần',
    lessons: 32,
    href: '/courses',
  },
  {
    title: 'Viết email chuyên nghiệp',
    tag: 'Business Writing',
    lessons: 18,
    href: '/courses',
  },
  {
    title: 'Giao tiếp A2-B1',
    tag: 'Speaking Practice',
    lessons: 24,
    href: '/courses',
  },
];

const supportItems = [
  { title: 'Lộ trình rõ ràng', desc: 'Theo dõi tiến độ từng kỹ năng, gợi ý buổi học tiếp theo.', icon: <LineChart className="h-5 w-5" /> },
  { title: 'Bài tập đa dạng', desc: 'Video, đọc hiểu, bài nghe và trắc nghiệm tự chấm.', icon: <BookOpen className="h-5 w-5" /> },
  { title: 'Nhắc học thông minh', desc: 'Nhận thông báo lịch học và nhắc mục tiêu hằng tuần.', icon: <CheckCircle2 className="h-5 w-5" /> },
];

export default function EdumeMainContent() {
  return (
    <div className="space-y-12">
      <Hero />
      <LearningNow />
      <FeaturedCourses />
      <SupportSection />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative grid gap-12 px-6 py-14 md:grid-cols-2 md:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-12 h-28 w-28 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute right-10 top-8 h-20 w-20 rounded-full bg-amber-200/70 blur-2xl" />
        <div className="absolute left-24 bottom-10 h-24 w-24 rounded-full bg-emerald-200/70 blur-3xl" />
      </div>

      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow-sm">
          Nền tảng học tập
        </div>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
          Học hiệu quả với lộ trình rõ ràng tại PotatoEdu
        </h1>
        <p className="max-w-xl text-base text-slate-600">
          Xây dựng lộ trình theo kỹ năng, theo dõi tiến độ từng buổi học và nhận gợi ý luyện tập
          tiếp theo để chạm mục tiêu nhanh hơn.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Badge>+120 giờ nội dung</Badge>
          <Badge>3 lộ trình TOEIC</Badge>
          <Badge>Chấm điểm tự động</Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Xem khóa học
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Bắt đầu miễn phí
            <Play className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute -left-10 -top-6 h-20 w-20 rounded-full bg-emerald-200/70 blur-3xl" />
        <div className="absolute right-2 bottom-0 h-24 w-24 rounded-full bg-purple-200/60 blur-3xl" />

        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/10">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
              <span>Đang học</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {learningNow.completedLessons}/{learningNow.totalLessons} bài
              </span>
            </div>
            <p className="mt-3 text-lg font-bold text-slate-900">{learningNow.title}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Tiến độ</span>
                <span>{learningNow.progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${learningNow.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Tiếp theo: {learningNow.nextAction}</p>
            </div>
            <button className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
              Tiếp tục học
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard title="Tổng thời gian học" value="32 giờ" sub="Tháng này" />
            <StatCard title="Điểm trung bình" value="8.4/10" sub="Đã chấm tự động" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LearningNow() {
  return (
    <section className="px-6 md:px-10">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:flex md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Đích đến rõ ràng</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Lộ trình TOEIC theo mục tiêu</h2>
          <p className="mt-2 text-sm text-slate-600">
            Chọn mục tiêu 450/650/800+, hệ thống tự đề xuất lịch học và kiểm tra tiến độ mỗi tuần.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 md:mt-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-sm font-semibold text-slate-800">
            <p>3 lộ trình sẵn sàng</p>
            <p className="text-xs text-slate-500">Từ cơ bản tới nâng cao</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCourses() {
  return (
    <section className="px-6 pb-6 md:px-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Khoá học nổi bật</p>
          <h3 className="text-2xl font-semibold text-slate-900">Chọn khóa phù hợp với bạn</h3>
        </div>
        <Link href="/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          Xem tất cả
        </Link>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {featuredCourses.map((course) => (
          <CourseCard key={course.title} {...course} />
        ))}
      </div>
    </section>
  );
}

function SupportSection() {
  return (
    <section className="px-6 pb-12 md:px-10">
      <div className="space-y-3 text-center">
        <h3 className="text-2xl font-semibold text-slate-900">Công cụ hỗ trợ học viên</h3>
        <p className="mx-auto max-w-2xl text-sm text-slate-600">
          Nhắc học, chấm điểm tự động, gợi ý buổi học tiếp theo giúp bạn duy trì nhịp học ổn định.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {supportItems.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {item.icon}
            </div>
            <h4 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h4>
            <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm">
      {children}
    </span>
  );
}

function CourseCard({ title, tag, lessons, href }: { title: string; tag: string; lessons: number; href: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/10">
      <div className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase text-blue-700">
        {tag}
      </div>
      <h4 className="text-xl font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-600">{lessons} bài học, kèm bài tập & kiểm tra nhỏ.</p>
      <Link
        href={href}
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        Vào xem khóa
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}
