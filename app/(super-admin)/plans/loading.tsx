import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export default function PlansLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {["plan-1", "plan-2", "plan-3"].map((id) => (
          <Card key={id} className="flex flex-col gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
