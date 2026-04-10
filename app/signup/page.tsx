import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/register-form";
import { getSession } from "@/lib/auth";

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Smart Attendance AI
          </span>
        </div>

        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-[var(--color-ink)]">
              Create an account
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Sign up to access the dashboard
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
