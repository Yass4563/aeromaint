"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

interface NotificationResponse {
  total?: number;
  aValider?: Array<{ id: string; equipement: { nom: string } }>;
  enRetard?: Array<{ id: string; equipement: { nom: string } }>;
}

export function NotificationBell({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationResponse | null>(null);

  useEffect(() => {
    fetch("/api/tasks?vue=today")
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch(() => setData(null));
  }, []);

  const count =
    role === "TECHNICIEN"
      ? data?.enRetard?.length || 0
      : data?.total || data?.aValider?.length || 0;

  const items =
    role === "TECHNICIEN"
      ? data?.enRetard?.map((item) => ({ id: item.id, label: `Tache en retard : ${item.equipement.nom}` })) || []
      : data?.aValider?.map((item) => ({ id: item.id, label: `Validation : ${item.equipement.nom}` })) || [];

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-full p-2 transition hover:bg-primary-soft"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-xs font-semibold text-white">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-border bg-surface p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">Notifications</p>
            <Badge label={`${count}`} />
          </div>
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map((item) => (
                <Link
                  key={item.id}
                  href="/tasks"
                  className="block rounded-xl bg-primary-soft px-3 py-2 text-sm text-foreground"
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted">Aucune notification pour le moment.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
