import { requireSession } from "@/lib/auth";
import { getUserByEmail, getStudentByUserId, getStudentAssignments, getLatestAnnouncementsForRole } from "@/lib/db";
import { AlertCircle, BookOpen, Clock, HelpCircle, MessageSquare, Layout, School, Users, GraduationCap, Paperclip, Folder, ListTodo } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/time";

export default async function StudentAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;

  if (!studentProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to view assignments.</p>
      </div>
    );
  }

  const { tab = "stream" } = await searchParams;
  const assignments = await getStudentAssignments(studentProfile.id);
  const announcements = await getLatestAnnouncementsForRole("student", studentProfile.buildingId, 20);

  // Group assignments by topic
  const groupedAssignments: Record<string, typeof assignments> = {};
  assignments.forEach(a => {
    const topic = a.topic || "No Topic";
    if (!groupedAssignments[topic]) groupedAssignments[topic] = [];
    groupedAssignments[topic].push(a);
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap className="w-10 h-10 text-[var(--color-accent)]" />
            <div>
              <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight">Classroom</h1>
              <p className="text-sm text-[var(--color-muted)] font-medium">Your learning and updates in one place</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar: Upcoming */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-4 space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-ink)] uppercase tracking-wider">Upcoming</h3>
                <div className="space-y-4">
                   {assignments.filter(a => a.status !== 'Submitted').slice(0, 3).map(a => (
                     <div key={a.id} className="text-xs">
                        <p className="font-bold text-[var(--color-ink)] line-clamp-1">{a.title}</p>
                        <p className="text-[var(--color-muted)]">Due {new Date(a.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                     </div>
                   ))}
                   {assignments.filter(a => a.status !== 'Submitted').length === 0 && (
                     <p className="text-xs text-[var(--color-muted)] italic">Woohoo, no work due soon!</p>
                   )}
                </div>
                <Link href="?tab=classwork" className="block text-[10px] font-black text-[var(--color-accent)] hover:underline uppercase pt-2">View all</Link>
              </div>

              <div className="card p-4 bg-amber-500/5 border-amber-500/20">
                <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Pro Tip</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Use the <strong>Stream</strong> to check for quick updates and teacher announcements.
                </p>
              </div>
            </div>

            {/* Main Stream Feed */}
            <div className="lg:col-span-3 space-y-4">
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
                          <p className="text-xs font-bold text-[var(--color-ink)]">Teacher</p>
                          <p className="text-[10px] text-[var(--color-muted)]">{formatDateTime(ann.createdAt)}</p>
                        </div>
                        <h4 className="font-bold text-[var(--color-ink)]">{ann.title}</h4>
                        <p className="text-sm text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                        
                        {ann.attachmentUrl && (
                          <div className="pt-3">
                            <a 
                              href={ann.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--color-line)] text-xs font-medium hover:bg-[var(--color-accent)] hover:text-white transition-all group"
                            >
                              <Paperclip className="w-3 h-3 text-[var(--color-accent)] group-hover:text-white" />
                              <span>{ann.attachmentName || "View Resource"}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Classwork View */
          <div className="max-w-4xl mx-auto space-y-10">
            {Object.keys(groupedAssignments).length === 0 ? (
              <div className="card p-12 text-center border-dashed">
                <Layout className="w-12 h-12 text-[var(--color-muted)] opacity-20 mx-auto mb-4" />
                <p className="text-[var(--color-muted)] italic">No assignments posted in classwork yet.</p>
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
                                <p className="text-xs text-[var(--color-muted)] truncate">{a.className}</p>
                                {a.attachmentUrl && (
                                   <>
                                      <span className="text-[var(--color-line)] text-xs">•</span>
                                      <a 
                                        href={a.attachmentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Paperclip className="w-3 h-3" />
                                        {a.attachmentName || "Attachment"}
                                      </a>
                                   </>
                                )}
                             </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status === 'Submitted' ? 'bg-emerald-500/10 text-emerald-600' : 'text-[var(--color-muted)]'}`}>
                             {a.status}
                          </span>
                          <div className="text-right">
                            <p className="text-[10px] text-[var(--color-muted)] whitespace-nowrap font-bold uppercase">
                               Due {new Date(a.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-[9px] text-[var(--color-accent)] font-bold">
                               {a.points} pts
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            <div className="p-6 rounded-2xl bg-[var(--surface-2)] border border-[var(--color-line)] mt-12">
               <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-[var(--color-accent)]" />
                  About Classwork
               </h4>
               <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  The <strong>Classwork</strong> tab is your organized learning area. Assignments are grouped by topics like chapters or lesson weeks to help you find your work easily.
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
