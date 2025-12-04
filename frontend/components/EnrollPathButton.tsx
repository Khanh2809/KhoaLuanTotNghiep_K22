"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrollLearningPath } from "@/lib/api";
import { useAuth } from "@/lib/providers/auth-context";
import { Loader2, Check } from "lucide-react";

type Props = { pathId: number; defaultEnrolled?: boolean };

export default function EnrollPathButton({ pathId, defaultEnrolled = false }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(defaultEnrolled);

  async function handleEnroll() {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await enrollLearningPath(pathId);
      setDone(true);
      router.refresh();
    } catch (err: any) {
      if (err?.message === 'UNAUTH') router.push('/auth/login');
      else setError(err?.message || 'Khong the ghi danh lo trinh');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={loading || done}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {done ? <Check className="h-4 w-4" /> : loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {done ? 'Da ghi danh' : 'Ghi danh lo trinh'}
      </button>
      {error && <p className="text-xs text-red-200">{error}</p>}
    </div>
  );
}
