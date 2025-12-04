import './globals.css'
import type { Metadata } from 'next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { AuthProvider } from '@/lib/providers/auth-context';
import AppToaster from '@/components/ui/AppToaster';

export const metadata: Metadata = {
  title: 'MU - Education Platform',
  description: 'MoveUp - Nền tảng e-learning tích hợp phân tích học tập',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative flex min-h-screen flex-col bg-[#05070f] text-white antialiased">
        {/* Nền chung (dùng nền của hero cho toàn trang) */}
        <div className="pointer-events-none absolute inset-0 -z-20">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1024] via-[#05070f] to-[#04050c]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.18),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.18),transparent_40%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:140px_140px]" />
          <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-white/10 via-white/0 to-transparent blur-3xl" />
        </div>

        <AuthProvider>
          <Navbar />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        <AppToaster />
      </body>
    </html>
  )
}
