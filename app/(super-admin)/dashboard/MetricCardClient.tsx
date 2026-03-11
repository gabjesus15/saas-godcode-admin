"use client";
import dynamic from "next/dynamic";

const MetricCard = dynamic(() => import("../../../components/super-admin/metric-card").then(mod => mod.default), { ssr: false });

export function MetricCardClient({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <MetricCard label={label} value={value} helper={helper} />
  );
}
