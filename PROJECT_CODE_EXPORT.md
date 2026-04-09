# Project Code Export

This file is a combined snapshot of the main project source files.

## .env.example

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=faris
SESSION_SECRET=change-this-secret-before-production
APP_TIMEZONE=Europe/Berlin

```

## README.md

```md
# RollCall Studio

A personal-project attendance website built with Next.js. It gives you:

- Admin login with signed cookies
- Student roster management
- Quick check-in by student ID
- Attendance timeline and student detail history
- CSV export for attendance reports

This build intentionally does **not** include facial recognition or student biometric identification. It is structured so you can extend it with safer check-in methods like QR codes, barcode scanners, or cards.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the sample environment file and adjust the values:

```bash
copy .env.example .env.local
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

If you do not create `.env.local`, the app falls back to:

- Email: `admin@example.com`
- Password: `ChangeMe123!`

## Data storage

- Student and attendance data are stored in `data/attendance.sqlite`
- The SQLite database is created automatically on first run
- `data/` is ignored by git

## Exporting reports

- Full export: `/api/reports/attendance`
- Daily export: `/api/reports/attendance?date=YYYY-MM-DD`

## Notes

- The project currently supports one admin account from environment variables
- Attendance is limited to one check-in per student per day
- Timezone handling uses `APP_TIMEZONE`

```

## package.json

```json
{
  "name": "attendance-system",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "16.2.2",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^25.5.2",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.2",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}

```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}

```

## next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

```

## postcss.config.mjs

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

```

## eslint.config.mjs

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

```

## .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build
/data

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

```

## app\globals.css

```css
@import "tailwindcss";

:root {
  --color-canvas: #f4eee7;
  --color-panel: rgba(255, 255, 255, 0.78);
  --color-panel-dark: #0e373b;
  --color-ink: #16363b;
  --color-muted: #6b7b7d;
  --color-line: rgba(22, 54, 59, 0.1);
  --color-accent: #f3b252;
  --color-accent-ink: #4a2a00;
  --color-teal: #17837d;
}

@theme inline {
  --color-background: var(--color-canvas);
  --color-foreground: var(--color-ink);
  --font-sans: var(--font-display);
  --font-mono: var(--font-mono);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(243, 178, 82, 0.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(23, 131, 125, 0.14), transparent 28%),
    var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-display), sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
}

::selection {
  background: rgba(23, 131, 125, 0.18);
}

.panel {
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 2rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.72));
  box-shadow: 0 24px 60px rgba(18, 46, 53, 0.08);
  backdrop-filter: blur(18px);
  padding: 1.5rem;
}

.panel--dark {
  border-color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(9, 36, 39, 0.95), rgba(8, 46, 51, 0.9));
  box-shadow: 0 34px 80px rgba(10, 30, 34, 0.32);
}

.hero-panel {
  border: 1px solid rgba(255, 255, 255, 0.44);
  border-radius: 2rem;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.64)),
    radial-gradient(circle at top right, rgba(243, 178, 82, 0.22), transparent 30%);
  box-shadow: 0 26px 64px rgba(18, 46, 53, 0.08);
  padding: 1.75rem;
}

.eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-teal);
}

.section-title {
  font-family: var(--font-display), sans-serif;
  font-size: clamp(1.6rem, 1.3rem + 1vw, 2.1rem);
  font-weight: 600;
  line-height: 1.1;
  color: var(--color-ink);
}

.section-copy {
  max-width: 42rem;
  color: var(--color-muted);
  line-height: 1.7;
}

.field-label {
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.field-input {
  width: 100%;
  border: 1px solid rgba(22, 54, 59, 0.12);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.85);
  padding: 0.95rem 1rem;
  color: var(--color-ink);
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.field-input::placeholder {
  color: color-mix(in srgb, var(--color-muted) 76%, white);
}

.field-input:focus {
  border-color: rgba(23, 131, 125, 0.4);
  box-shadow: 0 0 0 4px rgba(23, 131, 125, 0.12);
}

.field-input--dark {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.07);
  color: white;
}

.field-input--dark::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.field-input--dark:focus {
  border-color: rgba(243, 178, 82, 0.45);
  box-shadow: 0 0 0 4px rgba(243, 178, 82, 0.12);
}

.metric-card {
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 1.7rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.68));
  padding: 1.35rem;
  box-shadow: 0 22px 48px rgba(18, 46, 53, 0.07);
}

.metric-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.metric-value {
  margin-top: 0.6rem;
  font-size: clamp(2rem, 1.75rem + 1vw, 2.7rem);
  font-weight: 700;
  line-height: 1;
  color: var(--color-ink);
}

.metric-copy {
  margin-top: 0.75rem;
  color: var(--color-muted);
  line-height: 1.6;
}

.pill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.85rem 1.2rem;
  font-size: 0.92rem;
  font-weight: 600;
  transition:
    transform 0.16s ease,
    filter 0.16s ease;
}

.pill-button:hover {
  transform: translateY(-1px);
}

.pill-button--dark {
  background: var(--color-ink);
  color: white;
}

.pill-button--accent {
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.form-message {
  border-radius: 1rem;
  border: 1px solid transparent;
  padding: 0.85rem 1rem;
  font-size: 0.92rem;
}

.form-message--success {
  border-color: #b9e6d0;
  background: #edfbf4;
  color: #156143;
}

.form-message--error {
  border-color: #f5bfcb;
  background: #fff0f4;
  color: #9a314d;
}

```

## app\layout.tsx

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "RollCall Studio",
  description:
    "A student attendance dashboard with roster management, quick check-ins, and exportable reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${monoFont.variable} h-full bg-[var(--color-canvas)]`}
    >
      <body className="min-h-full bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}

```

## app\page.tsx

```tsx
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  redirect(session ? "/dashboard" : "/login");
}

```

## app\login\page.tsx

```tsx
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
    <main className="min-h-screen overflow-hidden bg-[var(--color-canvas)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-[var(--color-panel-dark)] p-8 text-white shadow-[0_40px_100px_rgba(9,36,39,0.3)] sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,174,73,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(104,204,197,0.18),transparent_34%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-5">
              <p className="eyebrow text-white/60">RollCall Studio</p>
              <h1 className="max-w-xl font-[var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                A polished attendance desk for your personal project.
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                This build focuses on the website, roster, timeline, and exports.
                It intentionally uses non-biometric check-in so you can keep the
                project practical without relying on student facial recognition.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-3xl border border-white/12 bg-white/6 p-5 backdrop-blur">
                <p className="text-sm text-white/58">Roster</p>
                <p className="mt-3 text-2xl font-semibold">Students + IDs</p>
              </article>
              <article className="rounded-3xl border border-white/12 bg-white/6 p-5 backdrop-blur">
                <p className="text-sm text-white/58">Attendance</p>
                <p className="mt-3 text-2xl font-semibold">Instant check-ins</p>
              </article>
              <article className="rounded-3xl border border-white/12 bg-white/6 p-5 backdrop-blur">
                <p className="text-sm text-white/58">Reports</p>
                <p className="mt-3 text-2xl font-semibold">CSV timeline</p>
              </article>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="panel w-full max-w-xl space-y-6">
            <div className="space-y-2">
              <p className="eyebrow">Admin Access</p>
              <h2 className="section-title">Sign in to manage attendance</h2>
              <p className="section-copy">
                Use the admin account below for local development, then change the
                values in your environment file before sharing the app.
              </p>
            </div>

            <LoginForm defaultEmail={defaults.email} />

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <p className="font-medium">Local development defaults</p>
              <p className="mt-1">
                Email: <span className="font-mono">{defaults.email}</span>
              </p>
              {defaults.isUsingFallbackCredentials ? (
                <p className="mt-1">
                  Password:{" "}
                  <span className="font-mono">{defaults.password}</span>
                </p>
              ) : (
                <p className="mt-1">
                  Password is being read from your configured environment file.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

```

## app\actions\auth.ts

```ts
"use server";

import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  validateLogin,
} from "@/lib/auth";
import { idleActionState } from "@/lib/types";
import type { ActionState } from "@/lib/types";

export async function login(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      status: "error",
      message: "Enter both email and password.",
    } satisfies ActionState;
  }

  const isValid = await validateLogin(email, password);

  if (!isValid) {
    return {
      status: "error",
      message: "Those credentials do not match the admin account.",
    } satisfies ActionState;
  }

  await createSession(email);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

```

## app\actions\students.ts

```ts
"use server";

import { revalidatePath } from "next/cache";

import { createStudent, getStudentById, updateStudent } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { idleActionState } from "@/lib/types";
import type { ActionState } from "@/lib/types";

function parseStudentFields(formData: FormData) {
  return {
    studentCode: String(formData.get("studentCode") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    className: String(formData.get("className") ?? "").trim(),
  };
}

function validateStudentFields(input: {
  studentCode: string;
  fullName: string;
}) {
  if (!input.studentCode) {
    return "Student ID is required.";
  }

  if (!input.fullName) {
    return "Student name is required.";
  }

  return null;
}

function getDatabaseErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message.includes("UNIQUE constraint failed: students.student_code")
  ) {
    return "That student ID already exists.";
  }

  return "The student record could not be saved.";
}

export async function createStudentAction(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  await requireSession();

  const input = parseStudentFields(formData);
  const validationMessage = validateStudentFields(input);

  if (validationMessage) {
    return {
      status: "error",
      message: validationMessage,
    } satisfies ActionState;
  }

  try {
    createStudent(input);
  } catch (error) {
    return {
      status: "error",
      message: getDatabaseErrorMessage(error),
    } satisfies ActionState;
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath("/attendance");
  revalidatePath("/reports");

  return {
    status: "success",
    message: "Student added to the roster.",
  } satisfies ActionState;
}

export async function updateStudentAction(
  studentId: string,
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  await requireSession();

  if (!getStudentById(studentId)) {
    return {
      status: "error",
      message: "That student record no longer exists.",
    } satisfies ActionState;
  }

  const input = parseStudentFields(formData);
  const validationMessage = validateStudentFields(input);

  if (validationMessage) {
    return {
      status: "error",
      message: validationMessage,
    } satisfies ActionState;
  }

  try {
    updateStudent(studentId, input);
  } catch (error) {
    return {
      status: "error",
      message: getDatabaseErrorMessage(error),
    } satisfies ActionState;
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/attendance");
  revalidatePath("/reports");

  return {
    status: "success",
    message: "Student details updated.",
  } satisfies ActionState;
}

```

## app\actions\attendance.ts

```ts
"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { recordAttendanceByStudentCode } from "@/lib/db";
import { idleActionState } from "@/lib/types";
import type { ActionState } from "@/lib/types";

export async function checkInStudentAction(
  previousState: ActionState = idleActionState,
  formData: FormData,
) {
  void previousState;
  await requireSession();

  const studentCode = String(formData.get("studentCode") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentCode) {
    return {
      status: "error",
      message: "Enter a student ID before checking in.",
    } satisfies ActionState;
  }

  const result = recordAttendanceByStudentCode({
    studentCode,
    notes,
  });

  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  revalidatePath("/reports");

  if (result.status === "created") {
    revalidatePath(`/students/${result.student.id}`);

    return {
      status: "success",
      message: result.message,
    } satisfies ActionState;
  }

  return {
    status: "error",
    message: result.message,
  } satisfies ActionState;
}

```

## app\api\reports\attendance\route.ts

```ts
import { requireSession } from "@/lib/auth";
import { listAttendanceReport } from "@/lib/db";

export const runtime = "nodejs";

function escapeCsvCell(value: string | null) {
  if (value === null) {
    return "";
  }

  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}

export async function GET(request: Request) {
  await requireSession();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const events = listAttendanceReport(5000, date);

  const lines = [
    [
      "student_id",
      "student_name",
      "class_name",
      "source",
      "attendance_date",
      "captured_at",
      "notes",
    ].join(","),
    ...events.map((event) =>
      [
        escapeCsvCell(event.studentCodeSnapshot),
        escapeCsvCell(event.fullNameSnapshot),
        escapeCsvCell(event.classNameSnapshot),
        escapeCsvCell(event.source),
        escapeCsvCell(event.attendanceDate),
        escapeCsvCell(event.capturedAt),
        escapeCsvCell(event.notes),
      ].join(","),
    ),
  ];

  const fileName = date
    ? `attendance-${date}.csv`
    : "attendance-report.csv";

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

```

## app\(dashboard)\layout.tsx

```tsx
import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { NavLink } from "@/components/nav-link";
import { requireSession } from "@/lib/auth";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/attendance", label: "Attendance" },
  { href: "/recognition", label: "Recognition" },
  { href: "/reports", label: "Reports" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[2rem] bg-[var(--color-panel-dark)] p-5 text-white shadow-[0_32px_80px_rgba(9,36,39,0.32)]">
          <div className="flex h-full flex-col gap-8">
            <div className="space-y-3">
              <Link href="/dashboard" className="block rounded-3xl bg-white/8 p-4">
                <p className="eyebrow text-white/58">RollCall Studio</p>
                <h1 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-tight">
                  Attendance HQ
                </h1>
              </Link>

              <div className="rounded-3xl border border-white/10 bg-white/6 p-4 text-sm text-white/72">
                Signed in as
                <p className="mt-2 break-all font-mono text-sm text-white">
                  {session.email}
                </p>
              </div>
            </div>

            <nav className="grid gap-3">
              {navigationItems.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>

            <div className="mt-auto space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/6 p-4 text-sm leading-6 text-white/68">
                Student biometrics are intentionally not included here. This build
                is ready for safer check-in methods like typed IDs, barcode
                scanners, or QR codes.
              </div>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="rounded-[2rem] bg-[var(--color-panel)] p-5 shadow-[0_32px_80px_rgba(24,47,54,0.08)] sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

```

## app\(dashboard)\dashboard\page.tsx

```tsx
import Link from "next/link";

import {
  getDailyAttendanceCounts,
  getDashboardSummary,
  listRecentAttendance,
} from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export default async function DashboardPage() {
  const summary = getDashboardSummary();
  const recentAttendance = listRecentAttendance(8);
  const chartData = getDailyAttendanceCounts(7);
  const chartMax = Math.max(...chartData.map((entry) => entry.total), 1);

  return (
    <div className="space-y-8">
      <section className="hero-panel">
        <div className="space-y-3">
          <p className="eyebrow">Command Center</p>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
            Keep attendance moving without the spreadsheet chaos.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Manage the roster, run a quick check-in desk, and export clean records
            when you need to share attendance outside the app.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/students" className="pill-button pill-button--dark">
            Add students
          </Link>
          <Link href="/attendance" className="pill-button pill-button--accent">
            Open attendance desk
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="metric-card">
            <p className="metric-label">Students</p>
            <p className="metric-value">{summary.totalStudents}</p>
            <p className="metric-copy">Tracked in your active roster</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Today</p>
            <p className="metric-value">{summary.todayAttendance}</p>
            <p className="metric-copy">Check-ins recorded today</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Last 7 Days</p>
            <p className="metric-value">{summary.attendanceLast7Days}</p>
            <p className="metric-copy">Attendance events in the last week</p>
          </article>
        </div>

        <article className="panel space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Attendance Rhythm</p>
              <h2 className="section-title">Last 7 days</h2>
            </div>
            <p className="rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              Local trend view
            </p>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {chartData.map((entry) => (
              <div key={entry.day} className="space-y-3">
                <div className="flex h-40 items-end rounded-3xl bg-[var(--color-canvas)] p-3">
                  <div
                    className="w-full rounded-2xl bg-[linear-gradient(180deg,var(--color-accent),color-mix(in_oklab,var(--color-accent)_70%,white))]"
                    style={{
                      height: `${Math.max((entry.total / chartMax) * 100, 8)}%`,
                    }}
                  />
                </div>
                <div className="text-center text-xs">
                  <p className="font-medium text-[var(--color-ink)]">
                    {entry.day.slice(5)}
                  </p>
                  <p className="text-[var(--color-muted)]">{entry.total} in</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="panel space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Recent Activity</p>
              <h2 className="section-title">Latest check-ins</h2>
            </div>
            <Link
              href="/reports"
              className="text-sm font-medium text-[var(--color-teal)]"
            >
              View full report
            </Link>
          </div>

          {recentAttendance.length ? (
            <div className="space-y-3">
              {recentAttendance.map((event) => (
                <article
                  key={event.id}
                  className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">
                        {event.fullNameSnapshot}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {event.studentCodeSnapshot}
                        {event.classNameSnapshot
                          ? ` | ${event.classNameSnapshot}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[var(--color-muted)]">
                      <p>{formatDateTime(event.capturedAt)}</p>
                      <p className="capitalize">
                        {event.source.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] px-5 py-10 text-center text-[var(--color-muted)]">
              No attendance yet. Add students first, then use the attendance desk
              to start building the timeline.
            </div>
          )}
        </article>

        <article className="panel space-y-5">
          <div className="space-y-1">
            <p className="eyebrow">Project Notes</p>
            <h2 className="section-title">Safe next steps</h2>
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl bg-[var(--color-canvas)] p-4">
              <p className="font-medium text-[var(--color-ink)]">
                Add a scanner flow
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Barcode or QR scanners work well here because they can submit a
                student ID straight into the check-in form.
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--color-canvas)] p-4">
              <p className="font-medium text-[var(--color-ink)]">
                Create sections
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                If you want morning and afternoon attendance later, add a session
                field to the attendance table and filter exports by session.
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--color-canvas)] p-4">
              <p className="font-medium text-[var(--color-ink)]">
                Protect production
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Before deployment, set your own admin credentials and session
                secret in the environment file.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

```

## app\(dashboard)\students\page.tsx

```tsx
import Link from "next/link";

import { StudentCreateForm } from "@/components/student-create-form";
import { listStudents } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export default async function StudentsPage() {
  const students = listStudents();

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <StudentCreateForm />

      <section className="panel space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Roster</p>
            <h1 className="section-title">Students</h1>
            <p className="section-copy">
              Keep student IDs short and consistent if you plan to add scanner
              hardware later.
            </p>
          </div>
          <p className="rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
            {students.length} total
          </p>
        </div>

        {students.length ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-line)]">
            <table className="min-w-full divide-y divide-[var(--color-line)] text-left">
              <thead className="bg-[var(--color-canvas)] text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] bg-white">
                {students.map((student) => (
                  <tr key={student.id} className="align-top">
                    <td className="px-4 py-4">
                      <Link
                        href={`/students/${student.id}`}
                        className="block rounded-2xl transition hover:bg-[var(--color-canvas)]"
                      >
                        <p className="font-medium text-[var(--color-ink)]">
                          {student.fullName}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {student.studentCode}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-muted)]">
                      {student.className ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--color-ink)]">
                      {student.attendanceCount}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-muted)]">
                      {student.lastAttendanceAt
                        ? formatDateTime(student.lastAttendanceAt)
                        : "No check-ins yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] px-5 py-12 text-center text-[var(--color-muted)]">
            No students yet. Use the form to add your first roster entry.
          </div>
        )}
      </section>
    </div>
  );
}

```

## app\(dashboard)\attendance\page.tsx

```tsx
import Link from "next/link";

import { AttendanceCheckInForm } from "@/components/attendance-checkin-form";
import { listRecentAttendance, listStudents } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export default async function AttendancePage() {
  const attendance = listRecentAttendance(18);
  const students = listStudents();

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <AttendanceCheckInForm />

      <section className="space-y-6">
        <article className="panel space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Ready To Use</p>
              <h2 className="section-title">Desk status</h2>
            </div>
            <div className="rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              {students.length} students in roster
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-[var(--color-canvas)] p-4">
              <p className="metric-label">Method</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                ID-based
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--color-canvas)] p-4">
              <p className="metric-label">Best fit</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                Desk or kiosk
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--color-canvas)] p-4">
              <p className="metric-label">Next upgrade</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                QR or scanner
              </p>
            </div>
          </div>
        </article>

        <article className="panel space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Live Timeline</p>
              <h2 className="section-title">Recent check-ins</h2>
            </div>
            <Link href="/reports" className="text-sm font-medium text-[var(--color-teal)]">
              Export records
            </Link>
          </div>

          {attendance.length ? (
            <div className="space-y-3">
              {attendance.map((event) => (
                <article
                  key={event.id}
                  className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-canvas)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-ink)]">
                        {event.fullNameSnapshot}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {event.studentCodeSnapshot}
                        {event.classNameSnapshot
                          ? ` • ${event.classNameSnapshot}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[var(--color-muted)]">
                      <p>{formatDateTime(event.capturedAt)}</p>
                      <p className="capitalize">{event.source.replaceAll("_", " ")}</p>
                    </div>
                  </div>
                  {event.notes ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                      {event.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] px-5 py-12 text-center text-[var(--color-muted)]">
              No check-ins yet. Add a student and then mark them present here.
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

```

## app\(dashboard)\recognition\page.tsx

```tsx
import Link from "next/link";

export default function RecognitionPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="panel flex w-full max-w-3xl flex-col items-center justify-center gap-6 py-20 text-center">
        <p className="eyebrow">Recognition</p>
        <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
          Recognition workspace
        </h1>
        <p className="max-w-xl text-base leading-7 text-[var(--color-muted)]">
          This page now opens with a centered action button.
        </p>

        <Link
          href="/recognition/camera-test"
          className="rounded-full bg-[var(--color-accent)] px-8 py-4 text-lg font-semibold text-[var(--color-accent-ink)] shadow-[0_18px_40px_rgba(243,178,82,0.28)] transition hover:brightness-105"
        >
          Start Face Scan
        </Link>
      </section>
    </div>
  );
}

```

## app\(dashboard)\recognition\camera-test\page.tsx

```tsx
import Link from "next/link";

import { CameraTestPanel } from "@/components/camera-test-panel";

export default function CameraTestPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/recognition"
        className="inline-flex text-sm font-medium text-[var(--color-teal)]"
      >
        ← Back to recognition
      </Link>

      <CameraTestPanel />
    </div>
  );
}

```

## app\(dashboard)\reports\page.tsx

```tsx
import Link from "next/link";

import { listAttendanceReport } from "@/lib/db";
import { formatDateTime, toAttendanceDate } from "@/lib/time";

export default async function ReportsPage() {
  const events = listAttendanceReport(200);
  const today = toAttendanceDate(new Date().toISOString());

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <div className="space-y-3">
          <p className="eyebrow">Export Desk</p>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--color-ink)]">
            Attendance reports you can share outside the app.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Download everything as CSV or filter to today using the route below.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/api/reports/attendance" className="pill-button pill-button--dark">
            Export all CSV
          </Link>
          <Link
            href={`/api/reports/attendance?date=${today}`}
            className="pill-button pill-button--accent"
          >
            Export today only
          </Link>
        </div>
      </section>

      <section className="panel space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Latest 200 Rows</p>
            <h2 className="section-title">Preview</h2>
          </div>
          <p className="rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
            {events.length} records shown
          </p>
        </div>

        {events.length ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-line)]">
            <table className="min-w-full divide-y divide-[var(--color-line)] text-left">
              <thead className="bg-[var(--color-canvas)] text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)] bg-white">
                {events.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-medium text-[var(--color-ink)]">
                        {event.fullNameSnapshot}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {event.studentCodeSnapshot}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-muted)]">
                      {event.classNameSnapshot ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-4 text-sm capitalize text-[var(--color-muted)]">
                      {event.source.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-muted)]">
                      {formatDateTime(event.capturedAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--color-muted)]">
                      {event.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas)] px-5 py-12 text-center text-[var(--color-muted)]">
            No attendance records yet.
          </div>
        )}
      </section>
    </div>
  );
}

```

## components\submit-button.tsx

```tsx
"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function SubmitButton({
  label,
  pendingLabel,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? pendingLabel ?? "Saving..." : label}
    </button>
  );
}

```

## components\nav-link.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
        isActive
          ? "border-white/40 bg-white text-[var(--color-ink)] shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
          : "border-white/10 bg-white/6 text-white/74 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
}

```

## components\logout-button.tsx

```tsx
import { logout } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <SubmitButton
        label="Log Out"
        pendingLabel="Closing..."
        className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:border-white/24 hover:bg-white/12"
      />
    </form>
  );
}

```

## components\login-form.tsx

```tsx
"use client";

import { useActionState } from "react";

import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { idleActionState } from "@/lib/types";

type LoginFormProps = {
  defaultEmail: string;
};

export function LoginForm({ defaultEmail }: LoginFormProps) {
  const [state, action] = useActionState(login, idleActionState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label className="field-label" htmlFor="email">
          Admin email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          className="field-input"
          placeholder="admin@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field-input"
          placeholder="Enter the admin password"
          required
        />
      </div>

      <SubmitButton
        label="Open Dashboard"
        pendingLabel="Signing In..."
        className="w-full rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-accent-ink)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      />

      {state.message ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

```

## components\student-create-form.tsx

```tsx
"use client";

import { useActionState, useEffect, useRef } from "react";

import { createStudentAction } from "@/app/actions/students";
import { SubmitButton } from "@/components/submit-button";
import { idleActionState } from "@/lib/types";

export function StudentCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(createStudentAction, idleActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="panel space-y-5">
      <div className="space-y-1">
        <p className="eyebrow">Roster Builder</p>
        <h2 className="section-title">Add a student</h2>
        <p className="section-copy">
          Start with the ID students will type or scan. You can expand this later
          with QR, NFC, or card readers without changing the roster.
        </p>
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="studentCode">
          Student ID
        </label>
        <input
          id="studentCode"
          name="studentCode"
          className="field-input"
          placeholder="STU-001"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          className="field-input"
          placeholder="Ada Lovelace"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="className">
          Class or group
        </label>
        <input
          id="className"
          name="className"
          className="field-input"
          placeholder="Grade 10 - A"
        />
      </div>

      <SubmitButton
        label="Add To Roster"
        pendingLabel="Adding..."
        className="rounded-2xl bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color-mix(in_oklab,var(--color-ink)_90%,white)] disabled:cursor-not-allowed disabled:opacity-70"
      />

      {state.message ? (
        <p className={`form-message form-message--${state.status}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

```

## components\student-edit-form.tsx

```tsx
"use client";

import { useActionState } from "react";

import { updateStudentAction } from "@/app/actions/students";
import { SubmitButton } from "@/components/submit-button";
import { idleActionState } from "@/lib/types";
import type { Student } from "@/lib/types";

type StudentEditFormProps = {
  student: Student;
};

export function StudentEditForm({ student }: StudentEditFormProps) {
  const updateAction = updateStudentAction.bind(null, student.id);
  const [state, action] = useActionState(updateAction, idleActionState);

  return (
    <form action={action} className="panel space-y-5">
      <div className="space-y-1">
        <p className="eyebrow">Student Profile</p>
        <h1 className="section-title">{student.fullName}</h1>
        <p className="section-copy">
          Keep the student code stable so kiosk check-ins and exports stay clean.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="field-label" htmlFor="studentCode">
            Student ID
          </label>
          <input
            id="studentCode"
            name="studentCode"
            defaultValue={student.studentCode}
            className="field-input"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="field-label" htmlFor="className">
            Class or group
          </label>
          <input
            id="className"
            name="className"
            defaultValue={student.className ?? ""}
            className="field-input"
            placeholder="Grade 10 - A"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="field-label" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={student.fullName}
          className="field-input"
          required
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton
          label="Save Changes"
          pendingLabel="Saving..."
          className="rounded-2xl bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color-mix(in_oklab,var(--color-ink)_90%,white)] disabled:cursor-not-allowed disabled:opacity-70"
        />
        {state.message ? (
          <p className={`form-message form-message--${state.status}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

```

## components\attendance-checkin-form.tsx

```tsx
"use client";

import { useActionState, useEffect, useRef } from "react";

import { checkInStudentAction } from "@/app/actions/attendance";
import { SubmitButton } from "@/components/submit-button";
import { idleActionState } from "@/lib/types";

export function AttendanceCheckInForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(checkInStudentAction, idleActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="panel panel--dark space-y-5">
      <div className="space-y-2">
        <p className="eyebrow text-white/65">Check-In Desk</p>
        <h1 className="section-title text-white">Quick attendance</h1>
        <p className="section-copy text-white/70">
          Type or scan the student ID. The form is designed to work nicely with a
          barcode scanner that acts like a keyboard.
        </p>
      </div>

      <div className="space-y-2">
        <label className="field-label text-white/72" htmlFor="studentCode">
          Student ID
        </label>
        <input
          id="studentCode"
          name="studentCode"
          autoFocus
          className="field-input field-input--dark"
          placeholder="Scan or type the ID"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="field-label text-white/72" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="field-input field-input--dark min-h-24"
          placeholder="Optional arrival note"
        />
      </div>

      <SubmitButton
        label="Mark Present"
        pendingLabel="Checking In..."
        className="rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-accent-ink)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      />

      {state.message ? (
        <p className={`form-message form-message--${state.status}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

```

## components\camera-test-panel.tsx

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type CameraStatus = "checking" | "ready" | "error" | "stopped";

type CameraDetails = {
  resolution: string;
};

export function CameraTestPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("checking");
  const [message, setMessage] = useState("Starting camera...");
  const [details, setDetails] = useState<CameraDetails | null>(null);
  const [captureCount, setCaptureCount] = useState(0);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function startCamera() {
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        setDetails({
          resolution: `${videoRef.current.videoWidth} x ${videoRef.current.videoHeight}`
        });
      }

      setStatus("ready");
      setMessage("Camera ready. Click capture to save photo.");

    } catch {
      setStatus("error");
      setMessage("Camera not available or permission denied.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    const brightness = getBrightness(canvas);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const filename = `capture_${timestamp}_${captureCount + 1}.jpg`;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg");
    link.download = filename;
    link.click();

    setCaptureCount(captureCount + 1);

    if (brightness < 15) {
      setMessage("Photo saved but frame is very dark.");
    } else {
      setMessage(`Saved photo #${captureCount + 1}`);
    }
  }

  function getBrightness(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let total = 0;

    for (let i = 0; i < imgData.data.length; i += 4) {
      total += imgData.data[i];
      total += imgData.data[i + 1];
      total += imgData.data[i + 2];
    }

    return total / (imgData.data.length / 4) / 3;
  }

  function stopCamera() {
    stopStream();
    setStatus("stopped");
    setMessage("Camera stopped.");
  }

  useEffect(() => {
    startCamera();

    return () => stopStream();
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">

      <section className="panel space-y-5">

        <div>
          <h1 className="section-title">Camera Capture</h1>
          <p className="section-copy">
            Start camera and capture images for attendance system.
          </p>
        </div>

        <div className="rounded-xl overflow-hidden border p-2 bg-black">
          <video
            ref={videoRef}
            className="w-full"
            autoPlay
            muted
            playsInline
          />
        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            onClick={startCamera}
            className="px-6 py-3 bg-blue-600 text-white rounded-full"
          >
            Start Camera
          </button>

          <button
            onClick={capturePhoto}
            className="px-6 py-3 bg-green-600 text-white rounded-full"
          >
            Capture Photo
          </button>

          <button
            onClick={stopCamera}
            className="px-6 py-3 border rounded-full"
          >
            Stop Camera
          </button>

        </div>

      </section>

      <aside className="space-y-4">

        <div className="border p-4 rounded-xl">
          {message}
        </div>

        <div className="border p-4 rounded-xl">
          <p>Resolution</p>
          <strong>
            {details?.resolution ?? "Unknown"}
          </strong>
        </div>

        <div className="border p-4 rounded-xl">
          <p>Photos captured</p>
          <strong>{captureCount}</strong>
        </div>

      </aside>

    </div>
  );
}
```

## lib\types.ts

```ts
export type ActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const idleActionState: ActionState = {
  status: "idle",
  message: "",
};

export type Session = {
  email: string;
  expiresAt: number;
};

export type Student = {
  id: string;
  studentCode: string;
  fullName: string;
  className: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentListItem = Student & {
  attendanceCount: number;
  lastAttendanceAt: string | null;
};

export type AttendanceEvent = {
  id: string;
  studentId: string;
  studentCodeSnapshot: string;
  fullNameSnapshot: string;
  classNameSnapshot: string | null;
  source: string;
  notes: string | null;
  attendanceDate: string;
  capturedAt: string;
};

export type DashboardSummary = {
  totalStudents: number;
  todayAttendance: number;
  attendanceLast7Days: number;
};

export type DailyAttendanceCount = {
  day: string;
  total: number;
};

```

## lib\time.ts

```ts
const DEFAULT_TIME_ZONE = "Europe/Berlin";

function createFormatter(
  options: Intl.DateTimeFormatOptions,
  locale = "en-GB",
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: getAppTimeZone(),
    ...options,
  });
}

export function getAppTimeZone() {
  return process.env.APP_TIMEZONE?.trim() || DEFAULT_TIME_ZONE;
}

export function formatDateTime(value: string) {
  return createFormatter({
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateLabel(value: string) {
  return createFormatter({
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatDayName(value: string) {
  return createFormatter({
    weekday: "short",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function toAttendanceDate(value: string) {
  return createFormatter({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }, "en-CA").format(new Date(value));
}

export function isoNow() {
  return new Date().toISOString();
}

export function shiftDate(dateValue: string, amount: number) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

```

## lib\auth.ts

```ts
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Session } from "@/lib/types";

const SESSION_COOKIE = "rollcall_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

type SessionPayload = {
  email: string;
  exp: number;
};

function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim() || "admin@example.com";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "ChangeMe123!";
}

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || "dev-secret-change-me";
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();
}

function verifyToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const signature = Buffer.from(encodedSignature, "base64url");
    const expectedSignature = signPayload(encodedPayload);

    if (
      signature.length !== expectedSignature.length ||
      !timingSafeEqual(signature, expectedSignature)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (!payload.email || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function toSession(payload: SessionPayload): Session {
  return {
    email: payload.email,
    expiresAt: payload.exp,
  };
}

export function getAuthDefaults() {
  return {
    email: getAdminEmail(),
    password: getAdminPassword(),
    isUsingFallbackCredentials:
      !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
  };
}

export async function validateLogin(email: string, password: string) {
  return email === getAdminEmail() && password === getAdminPassword();
}

export async function createSession(email: string) {
  const payload = encodePayload({
    email,
    exp: Date.now() + SESSION_DURATION_MS,
  });
  const signature = signPayload(payload).toString("base64url");

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifyToken(token);

  return payload ? toSession(payload) : null;
});

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

```

## lib\db.ts

```ts
import "server-only";

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  formatDateLabel,
  isoNow,
  shiftDate,
  toAttendanceDate,
} from "@/lib/time";
import type {
  AttendanceEvent,
  DailyAttendanceCount,
  DashboardSummary,
  Student,
  StudentListItem,
} from "@/lib/types";

type DatabaseGlobal = {
  database?: DatabaseSync;
  isReady?: boolean;
};

const globalForDatabase = globalThis as typeof globalThis & DatabaseGlobal;

function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: String(row.id),
    studentCode: String(row.studentCode),
    fullName: String(row.fullName),
    className: row.className ? String(row.className) : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

function mapAttendanceEvent(row: Record<string, unknown>): AttendanceEvent {
  return {
    id: String(row.id),
    studentId: String(row.studentId),
    studentCodeSnapshot: String(row.studentCodeSnapshot),
    fullNameSnapshot: String(row.fullNameSnapshot),
    classNameSnapshot: row.classNameSnapshot
      ? String(row.classNameSnapshot)
      : null,
    source: String(row.source),
    notes: row.notes ? String(row.notes) : null,
    attendanceDate: String(row.attendanceDate),
    capturedAt: String(row.capturedAt),
  };
}

function mapStudentListItem(row: Record<string, unknown>): StudentListItem {
  return {
    ...mapStudent(row),
    attendanceCount: Number(row.attendanceCount ?? 0),
    lastAttendanceAt: row.lastAttendanceAt ? String(row.lastAttendanceAt) : null,
  };
}

function getDatabaseFilePath() {
  const dataDirectory = join(process.cwd(), "data");

  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  return join(dataDirectory, "attendance.sqlite");
}

function initializeDatabase(database: DatabaseSync) {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      class_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_events (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_code_snapshot TEXT NOT NULL,
      full_name_snapshot TEXT NOT NULL,
      class_name_snapshot TEXT,
      source TEXT NOT NULL,
      notes TEXT,
      attendance_date TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_events_student
      ON attendance_events(student_id, captured_at DESC);

    CREATE INDEX IF NOT EXISTS idx_attendance_events_date
      ON attendance_events(attendance_date, captured_at DESC);
  `);
}

function getDatabase() {
  if (!globalForDatabase.database) {
    globalForDatabase.database = new DatabaseSync(getDatabaseFilePath());
  }

  if (!globalForDatabase.isReady) {
    initializeDatabase(globalForDatabase.database);
    globalForDatabase.isReady = true;
  }

  return globalForDatabase.database;
}

function normalizeStudentCode(value: string) {
  return value.trim().toUpperCase();
}

function sanitizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function listStudents() {
  const database = getDatabase();
  const rows = database
    .prepare(`
      SELECT
        s.id,
        s.student_code AS studentCode,
        s.full_name AS fullName,
        s.class_name AS className,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt,
        COUNT(a.id) AS attendanceCount,
        MAX(a.captured_at) AS lastAttendanceAt
      FROM students s
      LEFT JOIN attendance_events a ON a.student_id = s.id
      GROUP BY s.id
      ORDER BY s.full_name COLLATE NOCASE ASC
    `)
    .all() as Record<string, unknown>[];

  return rows.map(mapStudentListItem);
}

export function getStudentById(studentId: string) {
  const database = getDatabase();
  const row = database
    .prepare(`
      SELECT
        id,
        student_code AS studentCode,
        full_name AS fullName,
        class_name AS className,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM students
      WHERE id = :studentId
      LIMIT 1
    `)
    .get({ studentId }) as Record<string, unknown> | undefined;

  return row ? mapStudent(row) : null;
}

export function createStudent(input: {
  studentCode: string;
  fullName: string;
  className?: string | null;
}) {
  const database = getDatabase();
  const now = isoNow();

  const student: Student = {
    id: randomUUID(),
    studentCode: normalizeStudentCode(input.studentCode),
    fullName: input.fullName.trim(),
    className: sanitizeOptional(input.className),
    createdAt: now,
    updatedAt: now,
  };

  database
    .prepare(`
      INSERT INTO students (
        id,
        student_code,
        full_name,
        class_name,
        created_at,
        updated_at
      ) VALUES (
        :id,
        :studentCode,
        :fullName,
        :className,
        :createdAt,
        :updatedAt
      )
    `)
    .run(student);

  return student;
}

export function updateStudent(
  studentId: string,
  input: {
    studentCode: string;
    fullName: string;
    className?: string | null;
  },
) {
  const database = getDatabase();
  const current = getStudentById(studentId);

  if (!current) {
    throw new Error("Student not found.");
  }

  const updatedStudent: Student = {
    ...current,
    studentCode: normalizeStudentCode(input.studentCode),
    fullName: input.fullName.trim(),
    className: sanitizeOptional(input.className),
    updatedAt: isoNow(),
  };

  database
    .prepare(`
      UPDATE students
      SET
        student_code = :studentCode,
        full_name = :fullName,
        class_name = :className,
        updated_at = :updatedAt
      WHERE id = :id
    `)
    .run(updatedStudent);

  return updatedStudent;
}

export function listRecentAttendance(limit = 12) {
  const database = getDatabase();
  const rows = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      ORDER BY captured_at DESC
      LIMIT :limit
    `)
    .all({ limit }) as Record<string, unknown>[];

  return rows.map(mapAttendanceEvent);
}

export function listAttendanceForStudent(studentId: string, limit = 20) {
  const database = getDatabase();
  const rows = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      WHERE student_id = :studentId
      ORDER BY captured_at DESC
      LIMIT :limit
    `)
    .all({ studentId, limit }) as Record<string, unknown>[];

  return rows.map(mapAttendanceEvent);
}

export function listAttendanceReport(limit = 200, date?: string | null) {
  const database = getDatabase();

  if (date) {
    const rows = database
      .prepare(`
        SELECT
          id,
          student_id AS studentId,
          student_code_snapshot AS studentCodeSnapshot,
          full_name_snapshot AS fullNameSnapshot,
          class_name_snapshot AS classNameSnapshot,
          source,
          notes,
          attendance_date AS attendanceDate,
          captured_at AS capturedAt
        FROM attendance_events
        WHERE attendance_date = :date
        ORDER BY captured_at DESC
        LIMIT :limit
      `)
      .all({ date, limit }) as Record<string, unknown>[];

    return rows.map(mapAttendanceEvent);
  }

  return listRecentAttendance(limit);
}

export function getDashboardSummary() {
  const database = getDatabase();
  const today = toAttendanceDate(isoNow());
  const sevenDaysAgo = shiftDate(today, -6);

  const totalStudents =
    (database.prepare(`SELECT COUNT(*) AS total FROM students`).get() as {
      total: number;
    }).total ?? 0;

  const todayAttendance =
    (
      database
        .prepare(
          `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date = :today`,
        )
        .get({ today }) as { total: number }
    ).total ?? 0;

  const attendanceLast7Days =
    (
      database
        .prepare(
          `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date >= :sevenDaysAgo`,
        )
        .get({ sevenDaysAgo }) as { total: number }
    ).total ?? 0;

  const summary: DashboardSummary = {
    totalStudents: Number(totalStudents),
    todayAttendance: Number(todayAttendance),
    attendanceLast7Days: Number(attendanceLast7Days),
  };

  return summary;
}

export function getDailyAttendanceCounts(days = 7) {
  const database = getDatabase();
  const today = toAttendanceDate(isoNow());
  const start = shiftDate(today, days * -1 + 1);

  const rows = database
    .prepare(`
      SELECT attendance_date AS day, COUNT(*) AS total
      FROM attendance_events
      WHERE attendance_date >= :start
      GROUP BY attendance_date
      ORDER BY attendance_date ASC
    `)
    .all({ start }) as Record<string, unknown>[];

  const countsByDay = new Map(
    rows.map((row) => [String(row.day), Number(row.total ?? 0)]),
  );

  const timeline: DailyAttendanceCount[] = [];

  for (let index = 0; index < days; index += 1) {
    const day = shiftDate(start, index);

    timeline.push({
      day,
      total: countsByDay.get(day) ?? 0,
    });
  }

  return timeline;
}

export function getRosterSnapshot() {
  const students = listStudents();
  const summary = getDashboardSummary();
  const dailyCounts = getDailyAttendanceCounts(7);
  const latestDay =
    dailyCounts[dailyCounts.length - 1]?.day ??
    toAttendanceDate(isoNow());

  return {
    students,
    summary,
    dailyCounts: dailyCounts.map((entry) => ({
      ...entry,
      label: formatDateLabel(entry.day),
      isToday: entry.day === latestDay,
    })),
  };
}

export function recordAttendanceByStudentCode(input: {
  studentCode: string;
  notes?: string | null;
  source?: string;
}) {
  const database = getDatabase();
  const studentCode = normalizeStudentCode(input.studentCode);
  const student = database
    .prepare(`
      SELECT
        id,
        student_code AS studentCode,
        full_name AS fullName,
        class_name AS className,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM students
      WHERE student_code = :studentCode
      LIMIT 1
    `)
    .get({ studentCode }) as Record<string, unknown> | undefined;

  if (!student) {
    return {
      status: "missing" as const,
      message: `No student was found for ID ${studentCode}.`,
    };
  }

  const mappedStudent = mapStudent(student);
  const capturedAt = isoNow();
  const attendanceDate = toAttendanceDate(capturedAt);

  const duplicate = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      WHERE student_id = :studentId AND attendance_date = :attendanceDate
      ORDER BY captured_at DESC
      LIMIT 1
    `)
    .get({
      studentId: mappedStudent.id,
      attendanceDate,
    }) as Record<string, unknown> | undefined;

  if (duplicate) {
    const existing = mapAttendanceEvent(duplicate);

    return {
      status: "duplicate" as const,
      message: `${mappedStudent.fullName} has already been checked in today.`,
      event: existing,
    };
  }

  const event: AttendanceEvent = {
    id: randomUUID(),
    studentId: mappedStudent.id,
    studentCodeSnapshot: mappedStudent.studentCode,
    fullNameSnapshot: mappedStudent.fullName,
    classNameSnapshot: mappedStudent.className,
    source: input.source?.trim() || "manual_checkin",
    notes: sanitizeOptional(input.notes),
    attendanceDate,
    capturedAt,
  };

  database
    .prepare(`
      INSERT INTO attendance_events (
        id,
        student_id,
        student_code_snapshot,
        full_name_snapshot,
        class_name_snapshot,
        source,
        notes,
        attendance_date,
        captured_at
      ) VALUES (
        :id,
        :studentId,
        :studentCodeSnapshot,
        :fullNameSnapshot,
        :classNameSnapshot,
        :source,
        :notes,
        :attendanceDate,
        :capturedAt
      )
    `)
    .run(event);

  return {
    status: "created" as const,
    message: `${mappedStudent.fullName} is marked present for today.`,
    event,
    student: mappedStudent,
  };
}

```


