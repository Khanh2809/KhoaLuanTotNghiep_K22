export const dynamic = 'force-static';

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
        <h1 className="text-2xl font-bold text-white">Chính sách & Quyền riêng tư</h1>
        <p className="mt-2 text-sm text-white/70">
          Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn và chỉ sử dụng cho mục đích vận hành nền tảng học tập.
        </p>

        <div className="prose prose-invert max-w-none mt-6">
          <h3>1. Dữ liệu thu thập</h3>
          <ul>
            <li>Thông tin tài khoản: tên, email.</li>
            <li>Hoạt động học tập: khoá đã ghi danh, bài đã hoàn thành, câu hỏi gửi cho Gia sư AI.</li>
          </ul>

          <h3>2. Cách sử dụng</h3>
          <p>
            Dữ liệu giúp cá nhân hoá lộ trình học, đồng bộ tiến độ và cải thiện chất lượng câu trả lời của Gia sư AI.
          </p>

          <h3>3. Lưu trữ & bảo mật</h3>
          <p>
            Dữ liệu được lưu trên hạ tầng bảo mật, truy cập hạn chế. Bạn có thể yêu cầu xoá tài khoản bất cứ lúc nào.
          </p>

          <h3>4. Cookie</h3>
          <p>Cookie đăng nhập dùng để xác thực phiên làm việc. Không sử dụng cho mục đích quảng cáo.</p>

          <h3>5. Liên hệ</h3>
          <p>Nếu có câu hỏi về quyền riêng tư, vui lòng liên hệ: <a href="mailto:Ayaiedu@example.com">Ayaiedu@example.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
