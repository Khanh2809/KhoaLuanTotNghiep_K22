export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/5" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-white/20" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-7 w-20 rounded bg-white/20" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
        ))}
      </div>

      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/5" />
          <div className="h-20 rounded-lg bg-white/5" />
        </div>
      ))}
    </div>
  );
}
