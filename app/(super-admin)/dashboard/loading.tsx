import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Card key={index} className="flex flex-col gap-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-40" />
        </Card>
      ))}
    </div>
  );
}
