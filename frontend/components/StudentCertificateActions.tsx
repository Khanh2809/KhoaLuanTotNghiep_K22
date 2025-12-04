"use client";

import { useEffect, useState } from "react";
import { requestCertificate, getCertificateStatus } from "@/lib/api";
import { useAuth } from "@/lib/providers/auth-context";
import { Loader2, Award, CheckCircle2, Shield, Clock4 } from "lucide-react";

type Props = {
  courseId: number;
  completionRate?: number | null;
  quizAvg?: number | null;
};

export default function StudentCertificateActions({ courseId, completionRate, quizAvg }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'pending'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const canRequest = (completionRate ?? 0) >= 1 && (quizAvg ?? 0) > 0.45;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) {
        setInitialized(true);
        return;
      }
      try {
        const resp = await getCertificateStatus(courseId);
        if (!mounted) return;
        if (resp.issued) {
          setStatus('done');
          setMessage('Bạn đã được cấp chứng chỉ.');
        } else if (resp.pending) {
          setStatus('pending');
          setMessage('Yêu cầu của bạn đang được xử lý.');
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setInitialized(true);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, user]);

  async function handleRequest() {
    if (!user) return;
    setStatus('loading');
    setMessage(null);
    setError(null);
    try {
      const resp = await requestCertificate(courseId);
      if (resp.autoIssued || resp.alreadyIssued) {
        setMessage('Đã cấp chứng chỉ cho bạn.');
        setStatus('done');
      } else if (resp.pendingApproval) {
        setMessage('Đã gửi yêu cầu tới giảng viên.');
        setStatus('pending');
      } else {
        setMessage('Yêu cầu đã được gửi.');
        setStatus('pending');
      }
    } catch (err: any) {
      if (err?.message === 'UNAUTH') setError('Cần đăng nhập để yêu cầu chứng chỉ.');
      else if (err?.message?.includes('dang duoc xu ly')) setError('Bạn đã gửi yêu cầu, vui lòng chờ xử lý.');
      else setError(err?.message || 'Không gửi được yêu cầu.');
      setStatus('idle');
    }
  }

  if (!canRequest) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
      <div className="flex items-center gap-2 text-white">
        <Award className="h-4 w-4" />
        <span>
          Đủ điều kiện xin chứng chỉ (tiến độ 100%, điểm quiz {">"}= 45%). Nếu điểm quiz {">"}= 90% sẽ được cấp thẳng.
        </span>
      </div>
      {message && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">
          {status === 'pending' ? <Clock4 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          <Shield className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      <button
        onClick={handleRequest}
        disabled={!initialized || status === 'loading' || status === 'pending' || status === 'done'}
        className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-1.5 font-semibold text-black shadow disabled:opacity-60"
      >
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
        {status === 'pending' || status === 'done' ? 'Đã gửi' : 'Yêu cầu chứng chỉ'}
      </button>
    </div>
  );
}
