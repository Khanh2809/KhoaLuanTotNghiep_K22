'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/providers/auth-context';
import Link from 'next/link';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});
  const router = useRouter();
  const { register, user, loading } = useAuth(); // <-- lấy user & loading

  // Guard: đã đăng nhập -> về trang chủ
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  if (!loading && user) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-sm text-gray-500">
        Đã đăng nhập, đang chuyển hướng…
      </div>
    );
  }

  const nameInvalid = !!touched.name && !name.trim();
  const emailInvalid = !!touched.email && (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
  const passwordInvalid = !!touched.password && (!password || password.length < 6);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const invalid = [
      name ? null : (setTouched(t => ({ ...t, name: true })), 'name'),
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? null : (setTouched(t => ({ ...t, email: true })), 'email'),
      password.length >= 6 ? null : (setTouched(t => ({ ...t, password: true })), 'password'),
    ].some(Boolean);
    if (invalid) return;

    setLoadingSubmit(true);
    try {
      await register(name, email, password);
      router.push('/');
    } catch (e: any) {
      setErr(e?.message || 'Đăng ký thất bại');
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-white/60">Bắt đầu hành trình học tập cùng Gia sư AI.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="name">Họ và tên</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, name: true }))}
                placeholder="Nguyễn Văn A"
                aria-invalid={nameInvalid}
                aria-describedby="name-help"
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40
                 focus:outline-none focus:ring-2 transition
                 ${nameInvalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="name-help" className={`mt-1 text-xs ${nameInvalid ? 'text-red-400' : 'text-white/50'}`}>
              {nameInvalid ? 'Vui lòng nhập họ và tên.' : 'Tên sẽ hiển thị trong hồ sơ học viên.'}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="reg-email">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                id="reg-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                placeholder="you@example.com"
                aria-invalid={emailInvalid}
                aria-describedby="reg-email-help"
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40
                 focus:outline-none focus:ring-2 transition
                 ${emailInvalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="reg-email-help" className={`mt-1 text-xs ${emailInvalid ? 'text-red-400' : 'text-white/50'}`}>
              {emailInvalid ? 'Email không hợp lệ. Ví dụ: name@domain.com' : 'Dùng email bạn kiểm tra thường xuyên.'}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="reg-password">Mật khẩu</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                placeholder="Tối thiểu 6 ký tự"
                aria-invalid={passwordInvalid}
                aria-describedby="reg-password-help"
                className={`w-full rounded-lg bg-black/40 border px-9 py-2.5 text-sm text-white placeholder-white/40
                 focus:outline-none focus:ring-2 transition
                 ${passwordInvalid ? 'border-red-400/60 ring-red-400/40' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'}`}
              />
            </div>
            <p id="reg-password-help" className={`mt-1 text-xs ${passwordInvalid ? 'text-red-400' : 'text-white/50'}`}>
              {passwordInvalid ? 'Mật khẩu tối thiểu 6 ký tự.' : 'Đừng dùng mật khẩu trùng với các dịch vụ khác.'}
            </p>
          </div>

          {err && (
            <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          )}

          <button
            disabled={loadingSubmit}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:-translate-y-0.5 hover:shadow disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {loadingSubmit ? 'Đang tạo…' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-white/70">
          Đã có tài khoản?{' '}
          <Link href="/auth/login" className="text-white underline-offset-4 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
