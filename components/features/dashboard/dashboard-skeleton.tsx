export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-white/[0.08] bg-white/[0.025] p-6"
          >
            <div className="mb-3 h-6 w-6 rounded bg-white/[0.06]" />
            <div className="mb-2 h-8 w-16 rounded bg-white/[0.06]" />
            <div className="mb-1 h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-3 w-32 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Projects Section Skeleton */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-10 w-40 animate-pulse rounded bg-white/[0.06]" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-white/[0.08] bg-white/[0.025] p-6"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="h-6 w-20 rounded bg-white/[0.06]" />
                <div className="h-6 w-16 rounded bg-white/[0.06]" />
              </div>
              <div className="mb-2 h-6 w-3/4 rounded bg-white/[0.06]" />
              <div className="mb-1 h-4 w-full rounded bg-white/[0.06]" />
              <div className="mb-4 h-4 w-5/6 rounded bg-white/[0.06]" />
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded bg-white/[0.06]" />
                <div className="h-10 w-20 rounded bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
