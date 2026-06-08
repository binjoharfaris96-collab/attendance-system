import { requireSession } from "@/lib/auth";
import { getUserByEmail, getStudentByUserId, getStudentAssignments, getStudentClasses } from "@/lib/db";
import { AlertCircle, ChevronDown, ClipboardList } from "lucide-react";
import Link from "next/link";

export default async function StudentTodoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string, classId?: string }>;
}) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;
  
  if (!studentProfile) return null;

  const { tab = "assigned", classId = "all" } = await searchParams;
  let assignments = await getStudentAssignments(studentProfile.id);
  const classes = await getStudentClasses(studentProfile.id);

  if (classId !== "all") {
    const c = classes.find(c => c.id === classId);
    if (c) {
      assignments = assignments.filter(a => a.className === c.name);
    }
  }

  // Filter based on tab
  if (tab === "assigned") {
    assignments = assignments.filter(a => a.status !== "Submitted" && (!a.dueDate || new Date(a.dueDate) >= new Date()));
  } else if (tab === "missing") {
    assignments = assignments.filter(a => a.status !== "Submitted" && a.dueDate && new Date(a.dueDate) < new Date());
  } else if (tab === "done") {
    assignments = assignments.filter(a => a.status === "Submitted");
  }

  const groupAssignments = (tasks: typeof assignments) => {
    const groups: Record<string, typeof assignments> = {
      "No due date": [],
      "This week": [],
      "Next week": [],
      "Later": []
    };

    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay())); // End of this week
    
    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfWeek.getDate() + 7);

    tasks.forEach(a => {
      if (!a.dueDate) {
        groups["No due date"].push(a);
      } else {
        const d = new Date(a.dueDate);
        if (d <= endOfWeek && d >= now) {
          groups["This week"].push(a);
        } else if (d > endOfWeek && d <= endOfNextWeek) {
          groups["Next week"].push(a);
        } else if (d > endOfNextWeek) {
          groups["Later"].push(a);
        } else {
           // If past due, just put in "This week" if it's missing, though "missing" tab doesn't use these buckets as strictly usually
           groups["This week"].push(a);
        }
      }
    });

    return groups;
  };

  const grouped = groupAssignments(assignments);

  return (
    <div className="flex flex-col h-full bg-[var(--color-canvas)]">
      {/* Tabs */}
      <div className="border-b border-[var(--color-line)] bg-[var(--surface-1)] px-4 sm:px-8">
        <div className="flex gap-8 pt-4">
          <Link 
            href="?tab=assigned" 
            className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${tab === "assigned" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
          >
            Assigned
          </Link>
          <Link 
            href="?tab=missing" 
            className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${tab === "missing" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
          >
            Missing
          </Link>
          <Link 
            href="?tab=done" 
            className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${tab === "done" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
          >
            Done
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl w-full mx-auto animate-in fade-in zoom-in-95 duration-500">
        
        {/* Filter */}
        <div className="mb-8 w-64 relative group">
          <select className="w-full appearance-none bg-[var(--surface-1)] border border-[var(--color-line)] text-[var(--color-ink)] rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]">
            <option value="all">All classes</option>
            {classes.map(c => (
               <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-[var(--color-muted)] pointer-events-none" />
        </div>

        {/* Content */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([label, tasks]) => (
            <details key={label} className="group border-b border-[var(--color-line)] last:border-0 pb-4" open={tasks.length > 0}>
              <summary className="flex justify-between items-center cursor-pointer list-none text-[var(--color-ink)] hover:bg-[var(--surface-2)] p-3 rounded-xl transition-colors">
                 <h2 className="text-xl font-medium">{label}</h2>
                 <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--color-accent)]">{tasks.length}</span>
                    <ChevronDown className="w-5 h-5 text-[var(--color-muted)] group-open:rotate-180 transition-transform" />
                 </div>
              </summary>
              <div className="mt-2 space-y-1">
                 {tasks.map(a => {
                    const c = classes.find(cls => cls.name === a.className);
                    return (
                      <Link key={a.id} href={`/student/classes/${c?.id}?tab=classwork`} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--surface-2)] group transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                               <ClipboardList className="w-5 h-5 text-[var(--color-accent)]" />
                            </div>
                            <div>
                               <p className="font-semibold text-sm text-[var(--color-ink)] group-hover:underline">{a.title}</p>
                               <p className="text-xs text-[var(--color-muted)]">{a.className}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            {a.dueDate ? (
                               <p className={`text-xs font-semibold ${tab === 'missing' ? 'text-[var(--color-danger)]' : (tab === 'done' ? 'text-emerald-500' : 'text-[var(--color-muted)]')}`}>
                                  {tab === 'done' ? 'Handed in' : (tab === 'missing' ? 'Missing' : `Due ${new Date(a.dueDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`)}
                               </p>
                            ) : (
                               <p className="text-xs text-[var(--color-muted)]">No due date</p>
                            )}
                         </div>
                      </Link>
                    );
                 })}
                 {tasks.length === 0 && (
                    <div className="p-4 text-center text-sm text-[var(--color-muted)] italic">
                       No assignments {label.toLowerCase()}.
                    </div>
                 )}
              </div>
            </details>
          ))}
        </div>

      </div>
    </div>
  );
}
