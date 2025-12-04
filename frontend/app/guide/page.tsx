'use client';

import Link from 'next/link';
import { BookOpen, PlayCircle, UserPlus, Shield, MessageSquare, Sparkles, CheckCircle2, TriangleAlert, HelpCircle } from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <section className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-white/70">Tài liệu • Bắt đầu nhanh</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-white tracking-tight">
              Hướng dẫn sử dụng AI Learning
            </h1>
            <p className="mt-2 text-white/70">
              Trang này giúp bạn nắm nhanh cách tạo tài khoản, ghi danh khóa học, học bài và
              dùng <span className="text-white">Gia sư AI</span> để giải đáp thắc mắc.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/courses"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:-translate-y-0.5 transition"
            >
              Khám phá khóa học
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
            >
              Tạo tài khoản
            </Link>
          </div>
        </div>
      </section>

      {/* 3 ưu điểm */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card title="Cá nhân hoá" icon={<Sparkles className="h-5 w-5" />}>
          Khoá học và gợi ý học tập được điều chỉnh theo mục tiêu và tiến độ của bạn.
        </Card>
        <Card title="Gia sư AI" icon={<MessageSquare className="h-5 w-5" />}>
          Hỏi–đáp tức thì ngay dưới mỗi bài học. Hỗ trợ markdown & mã nguồn có nút Copy.
        </Card>
        <Card title="Theo dõi tiến độ" icon={<CheckCircle2 className="h-5 w-5" />}>
          Đánh dấu hoàn thành từng bài, tiếp tục học lại từ nơi bạn dừng.
        </Card>
      </section>

      {/* Quy trình 1-2-3 */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">Bắt đầu trong 3 bước</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Step
            no="1"
            title="Tạo tài khoản"
            desc="Đăng ký bằng email và mật khẩu. Hệ thống sẽ kiểm tra trùng email."
            href="/auth/register"
            cta="Đăng ký"
            icon={<UserPlus className="h-5 w-5" />}
          />
          <Step
            no="2"
            title="Ghi danh khoá học"
            desc="Vào trang khoá học và bấm “Ghi danh / Bắt đầu học”."
            href="/courses"
            cta="Xem khóa học"
            icon={<BookOpen className="h-5 w-5" />}
          />
          <Step
            no="3"
            title="Học & hỏi"
            desc="Mở bài học đầu tiên, dùng Gia sư AI để hỏi mọi điều chưa rõ."
            href="/"
            cta="Về trang chủ"
            icon={<PlayCircle className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* Mẹo dùng Gia sư AI */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
        <h2 className="text-xl font-semibold text-white">Mẹo dùng Gia sư AI hiệu quả</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          <li>• Nêu bối cảnh rõ: “Mình đang học bài X, chưa hiểu phần Y”.</li>
          <li>• Yêu cầu ví dụ ngắn trước, sau đó bảo giải thích sâu hơn.</li>
          <li>• Với bài code, gửi đoạn lỗi và môi trường chạy (ngôn ngữ, phiên bản).</li>
          <li>• Dùng tiếng Việt hay tiếng Anh đều được.</li>
        </ul>
      </section>

      {/* Câu hỏi thường gặp */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">Câu hỏi thường gặp</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FAQ
            q="Tài khoản miễn phí có giới hạn gì?"
            a="Bạn có thể xem danh sách khoá học và các bài học miễn phí. Một số nội dung nâng cao cần ghi danh. Tạm thời thì mọi khóa học đều miễn phí"
          />
          <FAQ
            q="Làm sao tiếp tục học từ nơi đã dừng?"
            a="Trong trang chủ có mục “Lộ trình học của bạn”. Bấm ‘Tiếp tục’ ở khoá đã ghi danh."
          />
          <FAQ
            q="Gia sư AI lấy thông tin từ đâu?"
            a="AI tham chiếu nội dung bài học hiện tại để trả lời. Khi cần, AI sẽ đề xuất xem lại phần liên quan."
          />
          <FAQ
            q="Tại sao tôi không xem được bài học?"
            a="Để xem bài học thì yêu cầu phải ghi danh. Nếu đã ghi danh mà vẫn không truy cập được, hãy thử tải lại hoặc đăng xuất/đăng nhập hoặc liên hệ CSKH."
          />
        </div>
      </section>

      {/* Quyền riêng tư / bảo mật */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-white/80" />
          <div>
            <h3 className="text-white font-medium">Bảo mật & quyền riêng tư</h3>
            <p className="mt-1 text-sm text-white/70">
              Chúng tôi chỉ lưu trữ thông tin cần thiết để vận hành nền tảng và cải thiện trải nghiệm học tập.
              Xem thêm tại trang <Link href="/policy" className="underline underline-offset-4">Chính sách</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Liên hệ & hỗ trợ */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
          <h3 className="text-white font-medium flex items-center gap-2">
            <HelpCircle className="h-5 w-5" /> Hỗ trợ nhanh
          </h3>
          <p className="mt-1 text-sm text-white/70">
            Có câu hỏi về khoá học, thanh toán hoặc tài khoản?
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/contact" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:-translate-y-0.5 transition">
              Liên hệ
            </Link>
            <Link href="/courses" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition">
              Xem khoá phù hợp
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
          <h3 className="text-white font-medium flex items-center gap-2">
            <TriangleAlert className="h-5 w-5" /> Báo lỗi / Góp ý
          </h3>
          <p className="mt-1 text-sm text-white/70">
            Góp ý giao diện, tính năng hoặc báo lỗi để chúng tôi cải thiện nhanh hơn.
          </p>
          <div className="mt-3">
            <a
              href="mailto:Ayaiedu@example.com"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
            >
              Gửi email: Ayaiedu@example.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ----------------- Small components ----------------- */

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-white">{icon}</div>
        <div>
          <h3 className="font-medium text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/70">{children}</p>
        </div>
      </div>
    </div>
  );
}

function Step({
  no, title, desc, href, cta, icon,
}: { no: string; title: string; desc: string; href: string; cta: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white font-medium">{no}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white">{icon}</span>
            <h3 className="font-medium text-white">{title}</h3>
          </div>
          <p className="mt-1 text-sm text-white/70">{desc}</p>
          <Link href={href} className="mt-3 inline-block rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:-translate-y-0.5 transition">
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-white/90 font-medium">{q}</h4>
          <span className="text-white/60 transition group-open:rotate-180">⌄</span>
        </div>
      </summary>
      <p className="mt-2 text-sm text-white/70">{a}</p>
    </details>
  );
}
