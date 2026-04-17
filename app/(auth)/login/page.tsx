import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbe7ff_0%,#f5f3ee_45%,#f5f3ee_100%)] p-4">
      <Suspense fallback={<div className="w-full max-w-md rounded-[32px] border border-border bg-surface p-8 shadow-xl" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
