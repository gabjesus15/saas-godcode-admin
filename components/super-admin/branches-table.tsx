import { Card } from "../ui/card";
import { BranchRow } from "./branch-row";

interface BranchesTableProps {
  branches: Array<{
    id: string;
    name: string | null;
    slug: string | null;
    address: string | null;
    phone: string | null;
    is_active: boolean | null;
  }>;
}

export function BranchesTable({ branches }: BranchesTableProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">Sucursales</h3>
        <p className="text-sm text-zinc-500">
          Gestiona ubicaciones y disponibilidad.
        </p>
      </div>
      <div className="grid gap-4">
        {branches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
            No hay sucursales registradas.
          </div>
        ) : (
          branches.map((branch) => <BranchRow key={branch.id} branch={branch} />)
        )}
      </div>
    </Card>
  );
}
