import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={session.user} />
      <div className="page-shell flex gap-6">
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
