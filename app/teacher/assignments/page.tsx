import { requireSession } from "@/lib/auth";
import { getUserByEmail, getTeacherByUserId, getTeacherClasses, getTeacherAssignments, getLatestAnnouncementsForRole } from "@/lib/db";
import { AssignmentForm } from "@/components/teacher/assignment-form";
import { StreamForm } from "@/components/teacher/stream-form";
import { AlertCircle, CopyCheck, HelpCircle, MessageSquare, Layout, School, Folder, ListTodo, Paperclip, GraduationCap } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/time";

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const teacherProfile = user ? await getTeacherByUserId(user.id) : null;

  if (!teacherProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to manage assignments.</p>
      </div>
    );
  }

  const { tab = "classwork" } = await searchParams; // Teachers usually start in Classwork
  const classes = await getTeacherClasses(teacherProfile.id);
  const assignments = await getTeacherAssignments(teacherProfile.id);
  const announcements = await getLatestAnnouncementsForRole("teacher", teacherProfile.buildingId, 20);

  // Group assignments by topic
  const groupedAssignments: Record<string, typeof assignments> = {};
  assignments.forEach(a => {
    const topic = a.topic || "No Topic";
    if (!groupedAssignments[topic]) groupedAssignments[topic] = [];
    groupedAssignments[topic].push(a);
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CopyCheck className="w-10 h-10 text-[var(--color-accent)]" />
            <div>
              <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight">Assignment Hub</h1>
              <p className="text-sm text-[var(--color-muted)] font-medium">Manage class feed and learning materials</p>
            </div>
          </div>
          <Link 
            href="/assignments/guide" 
            className="btn btn--secondary flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Usage Guide</span>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--color-line)] gap-8 px-2">
          <Link 
            href="?tab=stream" 
            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${tab === "stream" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
          >
            <MessageSquare className="w-4 h-4" />
            📢 Stream
          </Link>
          <Link 
            href="?tab=classwork" 
            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${tab === "classwork" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
          >
            <Layout className="w-4 h-4" />
            📚 Classwork
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {tab === "stream" ? (
          /* Stream View (Teacher Announcements) */
          <div className="max-w-4xl mx-auto space-y-6">
            <StreamForm buildingId={teacherProfile.buildingId} />
            
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="card p-12 text-center border-dashed">
                  <MessageSquare className="w-12 h-12 text-[var(--color-muted)] opacity-20 mx-auto mb-4" />
                  <p className="text-[var(--color-muted)] italic">No announcements in the stream yet.</p>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="card p-6 border-l-4 border-l-blue-500/40 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <School className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[var(--color-ink)]">{ann.attachmentType === 'assignment_link' ? 'System Post' : 'You posted'}</p>
                          <p className="text-[10px] text-[var(--color-muted)]">{formatDateTime(ann.createdAt)}</p>
                        </div>
                        <h4 className="font-bold text-[var(--color-ink)]">{ann.title}</h4>
                        <p className="text-sm text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Classwork View (Assignments & Materials) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Dispatch Form */}
            <div className="lg:col-span-1">
               <AssignmentForm classes={classes} />
            </div>

            {/* Right: Organized Tasks */}
            <div className="lg:col-span-2 space-y-10">
              {Object.keys(groupedAssignments).length === 0 ? (
                <div className="card p-12 text-center border-dashed">
                  <CopyCheck className="w-12 h-12 text-[var(--color-muted)] opacity-20 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-[var(--color-ink)]">No tasks dispatched yet</h3>
                  <p className="text-[var(--color-muted)] text-sm max-w-xs mx-auto mt-2">Use the form on the left to start building your classwork curriculum.</p>
                </div>
              ) : (
                Object.entries(groupedAssignments).map(([topic, tasks]) => (
                  <div key={topic} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Folder className="w-5 h-5 text-[var(--color-accent)]" />
                      <h2 className="text-xl font-bold text-[var(--color-ink)]">{topic}</h2>
                    </div>
                    <div className="grid gap-2">
                      {tasks.map(a => (
                        <div key={a.id} className="card p-4 flex items-center justify-between hover:bg-[var(--surface-2)] transition-colors group cursor-pointer border-l-2 border-transparent hover:border-[var(--color-accent)]">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-accent)] transition-all">
                               <ListTodo className="w-4 h-4 text-[var(--color-accent)] group-hover:text-white" />
                            </div>
                            <div className="truncate">
                               <p className="font-bold text-sm text-[var(--color-ink)] truncate">{a.title}</p>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[var(--color-muted)] font-bold uppercase">{a.type}</span>
                                  <span className="text-[10px] text-[var(--color-muted)]">•</span>
                                  <span className="text-[10px] text-[var(--color-muted)]">{a.className}</span>
                               </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="hidden sm:flex flex-col items-end mr-2">
                               <p className="text-[10px] font-bold text-[var(--color-ink)]">{a.submittedCount} / {a.totalStudents}</p>
                               <p className="text-[8px] text-[var(--color-muted)] uppercase tracking-tighter">Handed in</p>
                            </div>
                            <span className="text-[10px] text-[var(--color-muted)] whitespace-nowrap bg-[var(--surface-1)] px-2 py-1 rounded border border-[var(--color-line)]">
                               Due {new Date(a.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
