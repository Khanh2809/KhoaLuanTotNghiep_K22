'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const emailInvalid = !!email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  function openMail() {
    const subject = encodeURIComponent('[AI Learning] Liên hệ từ ' + (name || 'Người dùng'));
    const body = encodeURIComponent(`${msg}\n\n---\nTên: ${name}\nEmail: ${email}`);
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
        <h1 className="text-2xl font-bold text-white">Liên hệ</h1>
        <p className="mt-2 text-sm text-white/70">Bạn có góp ý hay cần hỗ trợ? Gửi thông tin cho chúng tôi.</p>

        <div className="mt-6 grid gap-4">
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="name">Họ và tên</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-2
                ${emailInvalid ? 'border-red-400/60 bg-black/30 focus:ring-red-400/40' : 'border-white/10 bg-black/30 focus:ring-blue-400/50'}`}
            />
            {emailInvalid && <p className="mt-1 text-xs text-red-400">Email không hợp lệ.</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="msg">Nội dung</label>
            <textarea
              id="msg"
              rows={5}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Mô tả vấn đề hoặc góp ý của bạn…"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openMail}
              disabled={!msg.trim() || emailInvalid}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              Gửi email
            </button>
            <a
              href="mailto:support@example.com"
              className="text-sm text-white/80 underline-offset-4 hover:underline"
            >
              support@example.com
            </a>
          </div>

          <div className="mt-4 text-xs text-white/60">
            *Nút “Gửi email” sẽ mở ứng dụng mail mặc định với nội dung bạn đã nhập.
          </div>
        </div>
      </div>
    </div>
  );
}
