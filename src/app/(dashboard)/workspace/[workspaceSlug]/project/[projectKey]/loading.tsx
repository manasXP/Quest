import { Skeleton } from "@/components/ui/skeleton";

const columns = ["Backlog", "To Do", "In Progress", "In Review", "Done"];

function IssueCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-3/4" />
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  );
}

function ColumnSkeleton({ title, cardCount }: { title: string; cardCount: number }) {
  return (
    <div className="flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-slate-100 dark:bg-slate-800/50">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {title}
          </span>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden p-2">
        {Array.from({ length: cardCount }).map((_, i) => (
          <IssueCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  // Vary card counts to make it look realistic
  const cardCounts = [2, 3, 2, 1, 2];

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

      {/* Board skeleton */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex h-full gap-4">
          {columns.map((title, index) => (
            <ColumnSkeleton
              key={title}
              title={title}
              cardCount={cardCounts[index]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
