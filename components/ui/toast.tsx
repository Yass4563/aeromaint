"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error";
}

export function Toast({
  items,
  onClose,
}: {
  items: ToastItem[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto rounded-2xl border p-4 shadow-lg",
            item.type === "success"
              ? "border-teal-200 bg-teal-50 text-teal-900"
              : "border-red-200 bg-red-50 text-red-900",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{item.title}</p>
              {item.description ? <p className="mt-1 text-sm">{item.description}</p> : null}
            </div>
            <button type="button" onClick={() => onClose(item.id)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
