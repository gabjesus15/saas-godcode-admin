import { Card } from "../../../../components/ui/card";
import { Skeleton } from "../../../../components/ui/skeleton";

export default function CompanyDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 w-full" />
      </Card>
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  );
}
