import { requireSession } from "@/lib/auth";
import { 
  getUserByEmail, 
  listStudents, 
  listParentRequestsForParent, 
  getStudentById,
  getStudentAttendanceSummary,
  getStudentAssignments,
  getStudentTeachers,
  getBuildingAdmins,
  getLatestAnnouncementsForRole
} from "@/lib/db";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { sendParentRequestAction } from "@/app/actions/parent";
import { SearchableStudentSelect } from "@/components/searchable-student-select";
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Info,
  Clock,
  ExternalLink,
  Mail,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/time";

export default async function ParentDashboard() {
  const session = await requireSession();
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const parent = await getUserByEmail(session.email);
  if (!parent) return <div>Failed to load parent data</div>;

  const allStudents = await listStudents();
  const myRequests = await listParentRequestsForParent(parent.id);

  // Group by status
  const approvedRequests = myRequests.filter(r => r.status === "approved");
  const pendingRequests = myRequests.filter(r => r.status === "pending");

  // Fetch full nested data for each approved child in parallel
  const familyData = await Promise.all(
    approvedRequests.map(async (req) => {
      const student = await getStudentById(req.studentId);
      if (!student) return null;
      
      const [summary, assignments, teachers] = await Promise.all([
        getStudentAttendanceSummary(student.id),
        getStudentAssignments(student.id),
        getStudentTeachers(student.id)
      ]);
      
      return {
        ...student,
        summary,
        assignments, // includes status and score (grades)
        teachers
      };
    })
  );

  const children = familyData.filter((c): c is NonNullable<typeof c> => c !== null);

  // General data
  const buildingId = parent.buildingId;
  const [admins, announcements] = await Promise.all([
    getBuildingAdmins(buildingId),
    getLatestAnnouncementsForRole("parent", buildingId, 5)
  ]);

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/80 p-8 text-white shadow-2xl shadow-[var(--color-accent)]/20 md:p-12">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Family Dashboard
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            {lang === "ar" ? `مرحباً، ${parent.fullName}` : `Welcome back, ${parent.fullName.split(' ')[0]}!`}
          </h1>
          <p className="max-w-2xl text-lg font-medium text-white/80">
            Monitor your family's academic journey, attendance records, and stay updated with the latest school communications.
          </p>
        </div>
        <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl text-white/5 flex items-center justify-center translate-x-1/4 translate-y-1/4">
           <GraduationCap className="w-96 h-96 opacity-10" />
        </div>
      </section>

      {/* Quick Summary Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
         <div className="glass-card flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 shadow-inner">
               <Users className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Linked Children</p>
               <p className="text-2xl font-black text-[var(--color-ink)]">{children.length}</p>
            </div>
         </div>
         <div className="glass-card flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-inner">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Term Attendance</p>
               <p className="text-2xl font-black text-[var(--color-ink)]">
                  {children.length > 0 
                     ? Math.round(children.reduce((acc, c) => acc + c.summary.percentage, 0) / children.length)
                     : 0}%
               </p>
            </div>
         </div>
         <div className="glass-card flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
               <BookOpen className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Pending Tasks</p>
               <p className="text-2xl font-black text-[var(--color-ink)]">
                  {children.reduce((acc, c) => acc + c.assignments.filter(a => a.status === 'Not Submitted').length, 0)}
               </p>
            </div>
         </div>
         <div className="glass-card flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 shadow-inner">
               <Info className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">School Updates</p>
               <p className="text-2xl font-black text-[var(--color-ink)]">{announcements.length}</p>
            </div>
         </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        {/* Main Content Area */}
        <div className="space-y-12 min-w-0">
          
          {/* Children Profiles Section */}
          <section>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)]">Child Portfolios</h2>
                <p className="text-sm text-[var(--color-muted)] font-medium">Detailed performance and attendance per student</p>
              </div>
            </div>

            {children.length === 0 ? (
               <div className="rounded-3xl border-2 border-dashed border-[var(--color-line)] bg-[var(--surface-1)] p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--color-line)]">
                     <AlertCircle className="w-8 h-8 text-[var(--color-muted)]" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-ink)]">No Profiles Connected</h3>
                  <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto mt-2">
                     Use the registration tool on the right to link your account to your child's student record.
                  </p>
               </div>
            ) : (
               <div className="space-y-8">
                  {children.map((child) => (
                    <div key={child.id} className="card group divide-y divide-[var(--color-line)] overflow-hidden shadow-xl ring-1 ring-black/5 hover:ring-[var(--color-accent)]/20 transition-all duration-500">
                        {/* Child Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 bg-gradient-to-tr from-[var(--surface-2)] to-[var(--surface-1)]">
                           <div className="relative h-20 w-20 shrink-0">
                              {child.photoUrl ? (
                                <img src={child.photoUrl} alt="Profile" className="h-full w-full rounded-2xl object-cover shadow-md ring-2 ring-white/50" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[var(--color-accent)] text-2xl font-black text-white shadow-md">
                                  {child.fullName.charAt(0)}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white ring-2 ring-white shadow-sm">
                                 <UserCheck className="w-3.5 h-3.5" />
                              </div>
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className="text-2xl font-black text-[var(--color-ink)] truncate">{child.fullName}</h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-[var(--color-muted)]">
                                 <span className="flex items-center gap-1.5 uppercase">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    ID: <span className="text-[var(--color-ink)]">{child.studentCode}</span>
                                 </span>
                                 <span className="flex items-center gap-1.5 uppercase">
                                    <GraduationCap className="w-4 h-4 text-purple-500" />
                                    Class: <span className="text-[var(--color-ink)]">{child.className || "TBD"}</span>
                                 </span>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <div className="text-3xl font-black text-[var(--color-ink)]">{child.summary.percentage}%</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Attendance Rate</div>
                           </div>
                        </div>

                        {/* Recent Academics & Grades */}
                        <div className="p-6">
                           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-muted)] mb-4 flex items-center gap-2">
                              {/* <BarChart3 className="w-3.5 h-3.5" /> */}
                              Academic Progress & Grades
                           </h4>
                           {child.assignments.length === 0 ? (
                              <p className="text-sm font-medium text-[var(--color-muted)] italic py-4">No recent academic activity recorded.</p>
                           ) : (
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                 {child.assignments.slice(0, 3).map(a => (
                                    <div key={a.id} className="relative rounded-2xl border border-[var(--color-line)] bg-[var(--surface-1)] p-4 transition-all hover:border-[var(--color-accent)]/30 hover:shadow-lg">
                                       <div className="flex justify-between items-start gap-2">
                                          <p className="text-[10px] font-bold uppercase text-[var(--color-muted)] truncate">{a.className}</p>
                                          {a.score !== null ? (
                                             <span className="badge badge--emerald text-[10px] tabular-nums font-black">{a.score}%</span>
                                          ) : (
                                             <span className={`badge text-[10px] font-black uppercase ${a.status === 'Submitted' ? 'badge--blue' : 'badge--amber'}`}>
                                                {a.status}
                                             </span>
                                          )}
                                       </div>
                                       <h5 className="mt-2 text-sm font-bold text-[var(--color-ink)] line-clamp-1">{a.title}</h5>
                                       <div className="mt-3 flex items-center justify-between">
                                          <span className="text-[10px] font-medium text-[var(--color-muted)]">Due {formatDateTime(a.dueDate)}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* Teachers Directory */}
                        <div className="bg-[var(--surface-2)]/30 p-6">
                           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-muted)] mb-4">Faculty Assigned</h4>
                           <div className="flex flex-wrap gap-2">
                              {child.teachers.length === 0 ? (
                                 <span className="text-[10px] font-black text-[var(--color-muted)] opacity-50 italic">Teacher directory pending enrolment confirmation</span>
                              ) : (
                                 child.teachers.map(t => (
                                    <div key={t.fullName} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-line)] bg-white/50 shadow-sm transition-all hover:shadow-md">
                                       <div className="h-4 w-4 flex items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                                          {t.fullName.charAt(0)}
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-xs font-bold text-[var(--color-ink)] leading-none">{t.fullName}</span>
                                          <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-tighter mt-0.5">{t.subject}</span>
                                       </div>
                                    </div>
                                 ))
                              )}
                           </div>
                        </div>
                    </div>
                  ))}
               </div>
            )}
          </section>

          {/* Combined Grades Feed */}
          {children.length > 0 && (
             <section className="card p-0 overflow-hidden shadow-xl">
               <div className="p-6 border-b border-[var(--color-line)] bg-gradient-to-r from-purple-500/10 to-transparent flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[var(--color-ink)]">Integrated Academic Log</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mt-1">Assignments and results for all students</p>
                  </div>
                  <BookOpen className="w-6 h-6 text-purple-500" />
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-[var(--surface-2)] border-b border-[var(--color-line)]">
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Child</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Subject</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">Task</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] text-right">Result</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--color-line)]">
                        {children.flatMap(c => c.assignments.map(a => ({ ...a, childName: c.fullName }))).slice(0, 10).map((task, idx) => (
                           <tr key={idx} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                              <td className="p-4">
                                 <span className="text-xs font-black text-[var(--color-ink)]">{task.childName.split(' ')[0]}</span>
                              </td>
                              <td className="p-4">
                                 <span className="text-xs font-bold text-[var(--color-muted)] uppercase">{task.className}</span>
                              </td>
                              <td className="p-4">
                                 <p className="text-xs font-bold text-[var(--color-ink)] line-clamp-1">{task.title}</p>
                                 <p className="text-[9px] font-bold text-[var(--color-muted)] mt-0.5">Due {formatDateTime(task.dueDate)}</p>
                              </td>
                              <td className="p-4 text-right">
                                 {task.score !== null ? (
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{task.score}%</span>
                                 ) : (
                                    <span className={`text-[10px] font-black uppercase ${task.status === 'Not Submitted' ? 'text-amber-500' : 'text-blue-500'}`}>
                                       {task.status}
                                    </span>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             </section>
          )}

        </div>

        {/* Sidebar Space */}
        <div className="space-y-8">
          
          {/* Announcements Widget */}
          <section className="card p-6 border-l-4 border-l-amber-500 shadow-lg">
            <h3 className="text-lg font-black text-[var(--color-ink)] flex items-center gap-2 mb-4">
               <Info className="w-5 h-5 text-amber-500" />
               Latest Updates
            </h3>
            {announcements.length === 0 ? (
               <p className="text-sm italic text-[var(--color-muted)] py-4">No recent announcements for parents.</p>
            ) : (
               <div className="space-y-4">
                  {announcements.map(ann => (
                     <div key={ann.id} className="group relative ps-4 border-l-2 border-[var(--color-line)] hover:border-amber-500 transition-colors pb-4">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">{formatDateTime(ann.createdAt)}</p>
                        <h4 className="text-sm font-bold text-[var(--color-ink)] mt-1">{ann.title}</h4>
                        <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-2">{ann.content}</p>
                        <Link href="/announcements" className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-all">
                           Read Full Story
                           <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                     </div>
                  ))}
               </div>
            )}
          </section>

          {/* School Leadership Directory */}
          <section className="card p-0 overflow-hidden shadow-lg">
             <div className="p-6 border-b border-[var(--color-line)]">
                <h3 className="text-lg font-black text-[var(--color-ink)] flex items-center gap-2">
                   <UserCheck className="w-5 h-5 text-emerald-500" />
                   Support Team
                </h3>
             </div>
             <div className="divide-y divide-[var(--color-line)]">
                {admins.map(admin => (
                   <div key={admin.email} className="p-4 flex items-center justify-between group hover:bg-[var(--surface-2)] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="h-8 w-8 rounded-full bg-[var(--surface-2)] border border-[var(--color-line)] flex items-center justify-center text-[var(--color-accent)] font-black text-xs">
                            {admin.fullName.charAt(0)}
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs font-black text-[var(--color-ink)] truncate leading-none">{admin.fullName}</p>
                            <p className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-tighter mt-1">Admin Presence</p>
                         </div>
                      </div>
                      <a href={`mailto:${admin.email}`} className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all">
                         <Mail className="w-4 h-4" />
                      </a>
                   </div>
                ))}
             </div>
          </section>

          {/* Registration Widget */}
          <section className="card p-6 bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] border border-[var(--color-accent)]/20 shadow-xl">
            <h3 className="text-lg font-black text-[var(--color-ink)] mb-1">Registration Desk</h3>
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-tighter mb-4">Link a new student account</p>
            
            <form action={sendParentRequestAction} className="space-y-3">
              <SearchableStudentSelect students={allStudents.map(s => ({ id: s.id, fullName: s.fullName, studentCode: s.studentCode }))} />
              <button type="submit" className="btn btn--primary w-full shadow-lg shadow-[var(--color-accent)]/20 active:scale-95 transition-transform">
                 Submit Request
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--color-line)]">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-3">Pending Verification</h4>
               {pendingRequests.length === 0 ? (
                  <p className="text-[10px] italic text-[var(--color-muted)]">No outgoing requests waiting.</p>
               ) : (
                  <div className="space-y-2">
                     {pendingRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-2 p-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
                           <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                           <p className="text-[10px] font-bold text-orange-700 leading-tight">
                              Waiting for <span className="font-black underline">{req.studentName}</span>
                           </p>
                        </div>
                     ))}
                  </div>
               )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
