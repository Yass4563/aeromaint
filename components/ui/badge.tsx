import { EquipementStatut, TaskStatut } from "@prisma/client";

import { cn } from "@/lib/utils";

const map = {
  EN_SERVICE: "bg-teal-100 text-teal-900",
  HORS_SERVICE: "bg-slate-200 text-slate-700",
  EN_PANNE: "bg-red-100 text-red-900",
  OUVERTE: "bg-blue-100 text-blue-800",
  SOUMISE: "bg-amber-100 text-amber-900",
  VALIDEE: "bg-teal-100 text-teal-900",
  REJETEE: "bg-red-100 text-red-900",
  CLOTUREE: "bg-slate-200 text-slate-700",
} as const;

export function Badge({
  value,
  label,
  className,
}: {
  value?: EquipementStatut | TaskStatut | string | null;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        value && value in map ? map[value as keyof typeof map] : "bg-primary-soft text-foreground",
        className,
      )}
    >
      {label || value || "-"}
    </span>
  );
}
