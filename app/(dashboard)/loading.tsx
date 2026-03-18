export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="mb-2 h-7 w-40 animate-pulse rounded-lg bg-white/[0.04]" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-white/[0.03]" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 h-3 w-16 animate-pulse rounded bg-white/[0.04]" />
            <div className="h-7 w-12 animate-pulse rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div>
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-white/[0.04]" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-3 flex gap-2">
                <div className="h-5 w-16 animate-pulse rounded-md bg-white/[0.04]" />
                <div className="h-5 w-14 animate-pulse rounded-md bg-white/[0.04]" />
              </div>
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="mb-1 h-3 w-full animate-pulse rounded bg-white/[0.03]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.03]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
