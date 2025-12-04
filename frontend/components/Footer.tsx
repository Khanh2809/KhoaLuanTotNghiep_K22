export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="px-4 py-8 text-sm text-white/70">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-white">MoveUp</p>
              <p className="mt-1 text-xs text-white/60">
                Nền tảng e-learning tích hợp phân tích học tập.
              </p>
            </div>

            <ul className="flex flex-wrap gap-4 text-sm">
              <li><a className="hover:text-white transition" href="/about">Giới thiệu</a></li>
              <li><a className="hover:text-white transition" href="/courses">Khóa học</a></li>
              <li><a className="hover:text-white transition" href="/policy">Chính sách</a></li>
              <li><a className="hover:text-white transition" href="/contact">Liên hệ</a></li>
            </ul>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50">
            © {new Date().getFullYear()} MoveUp. Đã đăng ký mọi quyền.
          </div>
        </div>
      </div>
    </footer>
  );
}

