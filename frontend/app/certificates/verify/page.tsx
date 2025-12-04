"use client";

import { useState } from 'react';
import { verifyCertificate } from '@/lib/api';
import { Award, Loader2, Shield } from 'lucide-react';

export default function VerifyCertificatePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await verifyCertificate(code.trim());
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Khong xac thuc duoc chung chi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          <Award className="h-4 w-4" /> Xac thuc chung chi
        </p>
        <h1 className="text-3xl font-bold text-white">Kiem tra ma xac thuc</h1>
        <p className="text-sm text-white/70">Nhap ma tren chung chi de xem thong tin cap.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur">
        <div className="space-y-1">
          <label className="text-sm text-white/70">Ma xac thuc</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            placeholder="Nhap ma..."
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            <Shield className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={!code.trim() || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black shadow hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Xac thuc
        </button>
      </form>

      {result && result.certificate && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
          <div className="text-lg font-semibold text-white">Hop le</div>
          <p className="text-sm text-white/70">Khoa hoc: {result.certificate.course?.title}</p>
          <p className="text-sm text-white/70">Hoc vien: {result.certificate.user?.name} ({result.certificate.user?.email})</p>
          {result.certificate.issueDate && <p className="text-sm text-white/70">Cap ngay: {new Date(result.certificate.issueDate).toLocaleDateString('vi-VN')}</p>}
          {result.certificate.expiresAt && <p className="text-sm text-white/70">Het han: {new Date(result.certificate.expiresAt).toLocaleDateString('vi-VN')}</p>}
        </div>
      )}
    </div>
  );
}
