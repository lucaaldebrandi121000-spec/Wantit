import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Accedi — Wantit" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Bagliore colorato sullo sfondo, molto discreto */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, #a855f7 0%, #ec4899 45%, transparent 70%)" }}
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
