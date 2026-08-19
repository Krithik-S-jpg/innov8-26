import Skeleton from './Skeleton'

function LoadingSkeletonPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex max-w-6xl gap-4">
        <div className="hidden w-64 space-y-3 lg:block">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-36 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  )
}

export default LoadingSkeletonPage
