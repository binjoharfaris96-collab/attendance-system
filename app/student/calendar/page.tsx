import { requireSession } from "@/lib/auth";
import { getUserByEmail, getStudentByUserId, getStudentAssignments, getStudentClasses } from "@/lib/db";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const colorThemes = [
  "bg-blue-600 border-blue-700",
  "bg-emerald-600 border-emerald-700",
  "bg-indigo-600 border-indigo-700",
  "bg-rose-600 border-rose-700",
  "bg-amber-600 border-amber-700",
  "bg-purple-600 border-purple-700",
];

export default async function StudentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string, weekStart?: string }>;
}) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;
  
  if (!studentProfile) return null;

  const { classId = "all", weekStart } = await searchParams;
  let assignments = await getStudentAssignments(studentProfile.id);
  const classes = await getStudentClasses(studentProfile.id);

  if (classId !== "all") {
    const c = classes.find(c => c.id === classId);
    if (c) {
      assignments = assignments.filter(a => a.className === c.name);
    }
  }

  // Figure out the current week
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentStartDate = weekStart ? new Date(weekStart) : new Date(today);
  const dayOfWeek = currentStartDate.getDay();
  currentStartDate.setDate(currentStartDate.getDate() - dayOfWeek); // Start on Sunday

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentStartDate);
    d.setDate(currentStartDate.getDate() + i);
    return d;
  });

  const nextWeekStr = new Date(currentStartDate);
  nextWeekStr.setDate(nextWeekStr.getDate() + 7);
  const prevWeekStr = new Date(currentStartDate);
  prevWeekStr.setDate(prevWeekStr.getDate() - 7);

  const monthStr = currentStartDate.toLocaleDateString([], { month: 'short' });
  const yearStr = currentStartDate.toLocaleDateString([], { year: 'numeric' });

  return (
    <div className="flex flex-col h-full bg-[var(--color-canvas)] p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-6 mb-6">
        <div className="w-64 relative group">
          <select className="w-full appearance-none bg-[var(--surface-1)] border border-[var(--color-line)] text-[var(--color-ink)] rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
            <option value="all">All classes</option>
            {classes.map(c => (
               <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-[var(--color-muted)] pointer-events-none" />
        </div>

        <div className="flex items-center gap-4">
          <Link href={`?weekStart=${prevWeekStr.toISOString()}&classId=${classId}`} className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--color-ink)]">
             <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-[var(--color-ink)] min-w-[150px] text-center">
            {monthStr} {currentStartDate.getDate()} – {weekDates[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Link href={`?weekStart=${nextWeekStr.toISOString()}&classId=${classId}`} className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--color-ink)]">
             <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border border-[var(--color-line)] rounded-xl bg-[var(--surface-1)] flex overflow-hidden">
        {weekDates.map((date, i) => {
          const isToday = date.getTime() === today.getTime();
          
          // Get assignments for this day
          const dayAssignments = assignments.filter(a => {
            if (!a.dueDate) return false;
            const d = new Date(a.dueDate);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === date.getTime();
          });

          return (
            <div key={i} className="flex-1 flex flex-col min-w-[120px] border-r border-[var(--color-line)] last:border-0">
              {/* Day Header */}
              <div className="text-center py-4 border-b border-[var(--color-line)]">
                <p className="text-[10px] font-bold uppercase text-[var(--color-muted)] tracking-wider mb-1">
                   {date.toLocaleDateString([], { weekday: 'short' })}
                </p>
                <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--color-accent)] text-white font-bold' : 'text-[var(--color-ink)] text-xl'}`}>
                   {date.getDate()}
                </div>
              </div>

              {/* Day Content */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-[color-mix(in_srgb,var(--surface-1)_98%,transparent)]">
                {dayAssignments.map(a => {
                   const classIndex = classes.findIndex(c => c.name === a.className);
                   const theme = colorThemes[Math.max(0, classIndex) % colorThemes.length];
                   const c = classes[classIndex];
                   return (
                     <Link key={a.id} href={`/student/classes/${c?.id}?tab=classwork`} className={`block p-2 rounded-md ${theme} text-white shadow-sm hover:brightness-110 transition-all text-xs`}>
                        <p className="font-bold truncate" title={a.title}>{a.title}</p>
                        <p className="opacity-80 truncate text-[10px] mt-0.5">{a.className}</p>
                        {a.status === "Submitted" && (
                           <div className="mt-1 bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded w-max">Done</div>
                        )}
                     </Link>
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
