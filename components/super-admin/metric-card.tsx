import { Card } from "../ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <div className="text-3xl font-semibold text-zinc-900">{value}</div>
      {helper ? <p className="text-sm text-zinc-500">{helper}</p> : null}
    </Card>
  );
}
