import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getAuthDefaults, getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const defaults = getAuthDefaults();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
          <span className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Smart Attendance AI
          </span>
          <span className="rounded-full border border-[var(--color-line)] bg-[var(--surface-1)] px-1.5 py-0.5 text-[8px] font-medium text-[var(--color-muted)]">
            Build v1.0.3
          </span>
        </div>

        {/* Card */}
        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-[var(--color-ink)]">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <LoginForm defaultEmail={defaults.email} />

          {defaults.isUsingFallbackCredentials && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-medium">Default credentials</p>
              <p className="mt-1">
                Username: <span className="font-mono">{defaults.email}</span>
              </p>
              <p>
                Password:{" "}
                <span className="font-mono">{defaults.password}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
