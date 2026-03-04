import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export default function CompaniesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Card className="p-0">
        {["company-1", "company-2", "company-3"].map((id) => (
          <div
            key={id}
            className="grid grid-cols-12 gap-4 border-b border-zinc-200 px-6 py-4"
          >
            <Skeleton className="col-span-4 h-4" />
            <Skeleton className="col-span-3 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-3 h-8" />
          </div>
        ))}
      </Card>
    </div>
  );
}
