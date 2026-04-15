import { redirect } from "next/navigation";
import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { getAuthDefaults, getSession } from "@/lib/auth";

function GoogleErrorBanner({ error }: { error: string }) {
  const messages: Record<string, string> = {
    domain: "Access denied. Only @stu.kfs.sch.sa school emails are allowed.",
    cancelled: "Login was cancelled. Please try again.",
    csrf: "Security verification failed. Please try again.",
    config: "Google login is not configured. Contact your administrator.",
    token: "Failed to authenticate with Google. Please try again.",
    profile: "Could not retrieve your Google profile. Please try again.",
    no_email: "No email address found in your Google account.",
    missing_params: "Invalid login response. Please try again.",
    server: "An unexpected error occurred. Please try again.",
  };

  const message = messages[error] || "An error occurred during login. Please try again.";

  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p className="font-medium">Login failed</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const defaults = await getAuthDefaults();
  const { error } = await searchParams;
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID);

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
              Sign in with your school account to access the dashboard
            </p>
          </div>

          {/* OAuth error banner */}
          {error && <GoogleErrorBanner error={error} />}

          {/* Google OAuth button */}
          {googleConfigured && (
            <>
              <Link
                href="/api/auth/google"
                id="google-login-btn"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:shadow-md"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Sign in with Google
              </Link>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-line)]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--surface-1)] px-2 text-[var(--color-muted)]">
                    or continue with credentials
                  </span>
                </div>
              </div>
            </>
          )}

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
