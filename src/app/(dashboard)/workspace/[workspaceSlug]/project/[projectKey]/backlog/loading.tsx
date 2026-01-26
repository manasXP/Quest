import { Skeleton } from "@/components/ui/skeleton";

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b px-4 py-3">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-48 flex-1" />
      <Skeleton className="h-5 w-16 rounded" />
      <Skeleton className="h-5 w-16 rounded" />
      <Skeleton className="h-6 w-6 rounded-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Table skeleton */}
      <div className="flex-1 p-6">
        <div className="rounded-lg border bg-white dark:bg-slate-900">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
