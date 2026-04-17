import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 rounded-3xl border border-border bg-surface p-4 xl:block">
      <p className="mb-4 text-sm font-semibold text-muted">Navigation rapide</p>
      <div className="space-y-2 text-sm">
        <Link href="/dashboard" className="block rounded-xl px-3 py-2 hover:bg-primary-soft">
          Tableau de bord
        </Link>
        <Link href="/tasks" className="block rounded-xl px-3 py-2 hover:bg-primary-soft">
          Taches
        </Link>
        <Link href="/planning" className="block rounded-xl px-3 py-2 hover:bg-primary-soft">
          Planification
        </Link>
      </div>
    </aside>
  );
}
