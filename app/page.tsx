import Link from "next/link";

import { getSession } from "@/lib/auth";

const moduleRows = [
  {
    title: "Recognition Scanner",
    copy: "Live camera scanning to recognize students and log attendance automatically.",
    tag: "AI Check-In",
  },
  {
    title: "Attendance Log",
    copy: "Searchable records by student, date, class, and status for quick follow-up.",
    tag: "History",
  },
  {
    title: "Students & Profiles",
    copy: "Manage roster data, profile photos, grades, and discipline context in one place.",
    tag: "Roster",
  },
  {
    title: "Warnings & Device Logs",
    copy: "Track unknown faces and phone/device detections during active monitoring.",
    tag: "Security",
  },
  {
    title: "Behavior + Excuses",
    copy: "Submit incidents and approved excuses directly to the student record timeline.",
    tag: "Operations",
  },
  {
    title: "Statistics + Export",
    copy: "View attendance trends and export reports for school leadership and audits.",
    tag: "Reports",
  },
] as const;

const workflowSteps = [
  {
    id: "01",
    title: "Register Students",
    copy: "Add student details, classes, and face/profile photos to prepare recognition.",
  },
  {
    id: "02",
    title: "Set Attendance Window",
    copy: "Configure open time, late cutoff, and close time from Settings.",
  },
  {
    id: "03",
    title: "Run Scanner",
    copy: "Launch recognition to log presence quickly and detect unknown faces.",
  },
  {
    id: "04",
    title: "Monitor Exams",
    copy: "Use exam monitor to flag phones and suspicious activity in real time.",
  },
  {
    id: "05",
    title: "Resolve Incidents",
    copy: "Record behavior incidents and excuses so student records stay accurate.",
  },
  {
    id: "06",
    title: "Review + Export",
    copy: "Use dashboards and stats to review trends and export reports for staff.",
  },
] as const;

const featureBullets = [
  "Automatic check-in with recognition flow",
  "Unknown face snapshots with alert logging",
  "Phone/device detection event history",
  "Student profile timelines (attendance + behavior)",
  "Immediate theme and language switching",
  "Arabic and English interface support",
  "Role-safe admin route protection",
  "CSV/report export for attendance records",
] as const;

const faqRows = [
  {
    q: "Can we use it daily for normal school operations?",
    a: "Yes. The platform is built for daily use: check-ins, monitoring, student updates, incident logging, and reports in one dashboard.",
  },
  {
    q: "Does it support both Arabic and English teams?",
    a: "Yes. The interface supports both languages and switches direction/layout when Arabic is active.",
  },
  {
    q: "Can staff review what happened later?",
    a: "Yes. Attendance, warnings, device logs, behavior records, and excuses are all kept in searchable history views.",
  },
  {
    q: "Is it only attendance, or more than that?",
    a: "It is broader than attendance. It also covers exam monitoring, behavior workflows, alerts, analytics, and exports.",
  },
] as const;

export default async function Home() {
  const session = await getSession();
  const primaryHref = session ? "/dashboard" : "/login";

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 pb-16 pt-5 sm:px-6 lg:px-8">
      <div className="shell-glow-layer opacity-80" />
      <div className="shell-dot-layer opacity-45" />

      <div className="relative z-10 mx-auto w-full max-w-[1360px] space-y-7">
        <header className="glass-card flex min-h-[78px] flex-wrap items-start justify-between gap-3 px-4 py-4 sm:items-center sm:px-6 sm:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)] sm:text-xs">
                Smart School Operations
              </p>
              <h1 className="text-base font-semibold leading-tight tracking-tight text-[var(--color-ink)] sm:text-lg">
                Smart Attendance AI
              </h1>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <a href="#overview" className="pill-nav-item">Overview</a>
            <a href="#modules" className="pill-nav-item">Modules</a>
            <a href="#workflow" className="pill-nav-item">Workflow</a>
            <a href="#faq" className="pill-nav-item">FAQ</a>
          </nav>

          <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
            <Link href="/login" className="btn btn--outline hidden sm:inline-flex">
              Sign In
            </Link>
            <Link href={primaryHref} className="btn btn--primary w-full justify-center sm:w-auto">
              Enter Dashboard
            </Link>
          </div>
        </header>

        <section id="overview" className="depth-panel overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-7 lg:grid-cols-[1.28fr_0.72fr]">
            <div>
              <p className="eyebrow">Unified Attendance + Monitoring</p>
              <h2 className="mt-3 max-w-[760px] text-4xl font-black leading-[1.03] tracking-[-0.03em] text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
                One Platform For
                <span className="block text-[color-mix(in_srgb,var(--color-muted)_84%,white)]">
                  Attendance, Alerts, and Student Operations.
                </span>
              </h2>
              <p className="mt-4 max-w-[680px] text-sm leading-6 text-[var(--color-muted)] sm:text-base">
                Smart Attendance AI helps schools run the entire day from one control center:
                recognition check-in, logs, exam monitoring, behavior and excuse workflows,
                analytics, and export-ready reporting.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <article className="stat-tile">
                  <p className="metric-label">Coverage</p>
                  <p className="metric-value mt-2">End-to-End</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">From entry to reporting.</p>
                </article>
                <article className="stat-tile">
                  <p className="metric-label">Language</p>
                  <p className="metric-value mt-2">AR + EN</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Bilingual operations.</p>
                </article>
                <article className="stat-tile">
                  <p className="metric-label">Monitoring</p>
                  <p className="metric-value mt-2">Realtime</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Live alerts and logs.</p>
                </article>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                <Link href={primaryHref} className="btn btn--primary">
                  Open Workspace
                </Link>
                <a href="#modules" className="btn btn--outline">
                  Explore Features
                </a>
              </div>
            </div>

            <aside className="space-y-3">
              <div className="card">
                <p className="eyebrow">Live Activity</p>
                <div className="mt-4 flex h-[176px] items-end gap-2 rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-2)_52%,transparent)] p-4">
                  {[46, 62, 86, 72, 58, 93].map((value, index) => (
                    <span
                      key={index}
                      className="block flex-1 rounded-[10px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_84%,white)_0%,color-mix(in_srgb,var(--color-accent)_55%,var(--surface-2))_100%)]"
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <article className="stat-tile">
                  <p className="metric-label">Access</p>
                  <p className="mt-2 text-lg font-bold text-[var(--color-ink)]">Secured</p>
                </article>
                <article className="stat-tile">
                  <p className="metric-label">Reporting</p>
                  <p className="mt-2 text-lg font-bold text-[var(--color-ink)]">Ready</p>
                </article>
              </div>
            </aside>
          </div>
        </section>

        <section id="modules" className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="card">
            <p className="eyebrow">What The Website Does</p>
            <h3 className="section-title">Full Feature Workspace</h3>
            <p className="section-copy mt-2">
              Every module is connected, so check-ins, incidents, alerts, and student records
              stay synchronized across the platform.
            </p>

            <div className="mt-5 space-y-2.5">
              {moduleRows.map((item) => (
                <div key={item.title} className="list-row flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">{item.copy}</p>
                  </div>
                  <span className="soft-badge badge--blue shrink-0">{item.tag}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <p className="eyebrow">Platform Highlights</p>
            <h3 className="section-title">Built For Daily School Use</h3>
            <div className="mt-4 space-y-2">
              {featureBullets.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                  <span className="mt-[5px] inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_48%,transparent)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Best For
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
                School administrators, discipline teams, exam supervisors, and attendance officers
                who need a single source of truth for student operations.
              </p>
            </div>
          </article>
        </section>

        <section id="workflow" className="card">
          <p className="eyebrow">How It Works</p>
          <h3 className="section-title">Daily Operational Flow</h3>
          <p className="section-copy mt-2">
            From morning check-in to end-of-day reports, the system follows a clear process.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {workflowSteps.map((item) => (
              <article key={item.id} className="list-row p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Step {item.id}
                </p>
                <h4 className="mt-2 text-base font-semibold text-[var(--color-ink)]">{item.title}</h4>
                <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="card">
            <p className="eyebrow">Outcomes</p>
            <h3 className="section-title">What You Gain</h3>
            <div className="mt-4 space-y-3">
              {[
                "Faster attendance operations with fewer manual errors.",
                "Clear accountability through timestamped logs and reports.",
                "Better discipline follow-up by attaching incidents to profiles.",
                "Stronger exam supervision with active device detection.",
                "Faster reporting cycles for leadership and parents.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_44%,transparent)] px-4 py-3 text-sm text-[var(--color-ink)]">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article id="faq" className="card">
            <p className="eyebrow">FAQ</p>
            <h3 className="section-title">Common Questions</h3>
            <div className="mt-4 space-y-3">
              {faqRows.map((item) => (
                <div key={item.q} className="rounded-xl border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_44%,transparent)] p-4">
                  <h4 className="text-sm font-semibold text-[var(--color-ink)]">{item.q}</h4>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--color-muted)]">{item.a}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="depth-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Ready To Start</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                Open the platform and manage your school day from one place.
              </h3>
              <p className="mt-2 max-w-[760px] text-sm leading-6 text-[var(--color-muted)]">
                Use Smart Attendance AI to run attendance, monitoring, incidents, and reporting
                with a cleaner workflow and better visibility across the entire school.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={primaryHref} className="btn btn--primary">
                Enter Dashboard
              </Link>
              <Link href="/login" className="btn btn--outline">
                Admin Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
