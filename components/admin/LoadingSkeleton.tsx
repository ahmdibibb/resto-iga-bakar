export function DashboardCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
      </div>
      <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
      <div className="w-32 h-8 bg-gray-200 rounded"></div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

