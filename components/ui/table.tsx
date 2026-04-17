"use client";

import { ArrowDownUp } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TableHeader {
  key: string;
  label: string;
  sortable?: boolean;
}

export function Table({
  headers,
  children,
  emptyText = "Aucune donnee disponible.",
  className,
  onSort,
}: {
  headers: TableHeader[];
  children?: React.ReactNode;
  emptyText?: string;
  className?: string;
  onSort?: (key: string) => void;
}) {
  const hasRows = Boolean(children);

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-surface", className)}>
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-primary-soft/70 text-left text-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header.key} className="px-4 py-3 font-semibold">
                {header.sortable && onSort ? (
                  <button type="button" className="inline-flex items-center gap-2" onClick={() => onSort(header.key)}>
                    {header.label}
                    <ArrowDownUp className="h-4 w-4" />
                  </button>
                ) : (
                  header.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-muted">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
