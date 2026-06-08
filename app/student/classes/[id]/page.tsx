import { requireSession } from "@/lib/auth";
import { getUserByEmail, getStudentByUserId, getStudentAssignments, getClassById, listClassStudents, getLatestAnnouncementsForRole } from "@/lib/db";
import { AlertCircle, FileText, MessageSquare, Layout, Users, ListTodo, Paperclip, Folder, Video, Info } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/time";

export default async function StudentClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;
  
  if (!studentProfile) return null;

  const { id } = await params;
  const { tab = "stream" } = await searchParams;

  const classInfo = await getClassById(id);
  if (!classInfo) {
     return <div className="p-8 text-center text-[var(--color-danger)] font-bold">Class not found.</div>;
  }

  const allAssignments = await getStudentAssignments(studentProfile.id);
  const classAssignments = allAssignments.filter(a => a.className === classInfo.name);

  const upcomingAssignments = classAssignments
    .filter(a => a.status !== "Submitted" && (!a.dueDate || new Date(a.dueDate) >= new Date()))
    .slice(0, 3);

  const classmates = await listClassStudents(id);
  
  // Note: Currently announcements are building-wide, so we fetch them and maybe filter by class name if possible, 
  // or just show all for the student's building as it did originally.
  let announcements = await getLatestAnnouncementsForRole("student", studentProfile.buildingId, 20);
  // Optional: Try to filter to only ones mentioning this class if it was an automated post
  const classAnnouncements = announcements.filter(ann => ann.content.includes(classInfo.name));
  if (classAnnouncements.length > 0) {
      announcements = classAnnouncements;
  }

  // Group assignments by topic for Classwork tab
  const groupedAssignments: Record<string, typeof classAssignments> = {};
  classAssignments.forEach(a => {
    const topic = a.topic || "No Topic";
    if (!groupedAssignments[topic]) groupedAssignments[topic] = [];
    groupedAssignments[topic].push(a);
  });

  return (
    <div className="flex flex-col h-full bg-[var(--color-canvas)]">
      {/* Header Tabs Navigation */}
      <div className="border-b border-[var(--color-line)] bg-[var(--surface-1)] px-4 sm:px-8">
        <div className="flex items-center justify-between">
           <h1 className="text-xl font-bold text-[var(--color-ink)] py-4 hidden md:block truncate max-w-sm">{classInfo.name}</h1>
           <div className="flex gap-6 pt-4 justify-center md:justify-start w-full md:w-auto">
             <Link 
               href="?tab=stream" 
               className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${tab === "stream" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
             >
               Stream
             </Link>
             <Link 
               href="?tab=classwork" 
               className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${tab === "classwork" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
             >
               Classwork
             </Link>
             <Link 
               href="?tab=people" 
               className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${tab === "people" ? "border-b-[var(--color-accent)] text-[var(--color-accent)]" : "border-b-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"}`}
             >
               People
             </Link>
           </div>
           <div className="hidden md:block w-[100px]"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-5xl w-full mx-auto animate-in fade-in zoom-in-95 duration-500">
        
        {tab === "stream" && (
          <div className="space-y-6">
            {/* Class Banner */}
            <div className="h-48 md:h-64 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 text-white p-6 flex flex-col justify-end relative overflow-hidden shadow-md">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
               <div className="relative z-10">
                 <h1 className="text-3xl md:text-4xl font-bold mb-2">{classInfo.name}</h1>
                 {classInfo.subject && <p className="text-lg opacity-90">{classInfo.subject}</p>}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {/* Left Sidebar */}
               <div className="md:col-span-1 space-y-4">
                  {/* Meet Box (Placeholder) */}
                  <div className="border border-[var(--color-line)] bg-[var(--surface-1)] rounded-xl p-4 flex flex-col gap-3">
                     <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-sm text-[var(--color-ink)]">Meet</span>
                     </div>
                     <button className="btn btn--primary py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full rounded-md shadow-none">
                        Join
                     </button>
                  </div>

                  {/* Upcoming Box */}
                  <div className="border border-[var(--color-line)] bg-[var(--surface-1)] rounded-xl p-4 space-y-3">
                     <h3 className="text-sm font-semibold text-[var(--color-ink)]">Upcoming</h3>
                     <div className="space-y-2">
                        {upcomingAssignments.length > 0 ? (
                           upcomingAssignments.map(a => (
                              <div key={a.id} className="text-xs">
                                 <p className="text-[var(--color-muted)] truncate">
                                    {a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString([], { weekday: 'short' })}` : 'No due date'}
                                 </p>
                                 <Link href={`?tab=classwork`} className="font-medium text-[var(--color-ink)] hover:underline truncate block">
                                    {a.title}
                                 </Link>
                              </div>
                           ))
                        ) : (
                           <p className="text-xs text-[var(--color-muted)] italic">Woohoo, no work due soon!</p>
                        )}
                     </div>
                     <div className="pt-2">
                        <Link href={`/student/todo?classId=${id}`} className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
                           View all
                        </Link>
                     </div>
                  </div>
               </div>

               {/* Right Main Feed */}
               <div className="md:col-span-3 space-y-4">
                  <div className="border border-[var(--color-line)] bg-[var(--surface-1)] rounded-xl p-4 flex items-center gap-4 cursor-text shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold">
                        {studentProfile.fullName.charAt(0)}
                     </div>
                     <p className="text-sm text-[var(--color-muted)]">Announce something to your class</p>
                  </div>

                  {announcements.map((ann) => (
                    <div key={ann.id} className="border border-[var(--color-line)] bg-[var(--surface-1)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                          {classInfo.teacherName.charAt(0)}
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-[var(--color-ink)]">{classInfo.teacherName}</p>
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">{formatDateTime(ann.createdAt)}</p>
                          <h4 className="font-bold text-[var(--color-ink)] mt-3">{ann.title}</h4>
                          <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                          
                          {ann.attachmentUrl && (
                            <div className="pt-3">
                              <a 
                                href={ann.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-line)] hover:bg-[var(--surface-2)] transition-colors group w-full max-w-sm"
                              >
                                <div className="p-2 rounded bg-red-100 text-red-600">
                                   <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col truncate">
                                   <span className="text-sm font-semibold text-[var(--color-ink)] group-hover:underline truncate">{ann.attachmentName || "Material"}</span>
                                   <span className="text-xs text-[var(--color-muted)] uppercase">Attachment</span>
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {tab === "classwork" && (
          <div className="flex gap-8">
             {/* Left Sidebar Topics */}
             <div className="hidden md:block w-48 shrink-0">
                <div className="sticky top-8 space-y-1">
                   <h3 className="text-xs font-bold uppercase text-[var(--color-muted)] mb-3 px-3">Topics</h3>
                   <button className="w-full text-left px-3 py-2 text-sm font-bold text-[var(--color-ink)] bg-[var(--surface-2)] rounded-lg">All topics</button>
                   {Object.keys(groupedAssignments).map(topic => (
                      <button key={topic} className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--surface-2)] rounded-lg transition-colors truncate">
                         {topic}
                      </button>
                   ))}
                </div>
             </div>

             {/* Right Main Assignments */}
             <div className="flex-1 space-y-12">
               {Object.keys(groupedAssignments).length === 0 ? (
                 <div className="p-12 text-center border-2 border-dashed border-[var(--color-line)] rounded-2xl">
                   <p className="text-[var(--color-muted)]">No classwork posted yet.</p>
                 </div>
               ) : (
                 Object.entries(groupedAssignments).map(([topic, tasks]) => (
                   <div key={topic} className="space-y-4">
                     <h2 className="text-2xl font-semibold text-[var(--color-ink)] border-b border-[var(--color-accent)] pb-2 inline-block px-2">{topic}</h2>
                     <div className="grid gap-0">
                       {tasks.map(a => (
                         <div key={a.id} className="flex items-center justify-between hover:bg-[var(--surface-2)] p-4 transition-colors group cursor-pointer border-b border-[var(--color-line)] last:border-b-0 rounded-xl">
                           <div className="flex items-center gap-4 min-w-0">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${a.status === 'Submitted' ? 'bg-[var(--color-muted)] text-white/50' : 'bg-emerald-600 text-white shadow-sm'}`}>
                                <ListTodo className="w-5 h-5" />
                             </div>
                             <div className="truncate">
                                <p className={`font-semibold text-sm truncate ${a.status === 'Submitted' ? 'text-[var(--color-muted)]' : 'text-[var(--color-ink)]'}`}>{a.title}</p>
                                <p className="text-xs text-[var(--color-muted)]">
                                   {a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'No due date'}
                                </p>
                             </div>
                           </div>
                           <div className="flex items-center gap-4 shrink-0">
                             {a.status === 'Submitted' && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                                   Turned in
                                </span>
                             )}
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

        {tab === "people" && (
          <div className="max-w-3xl mx-auto space-y-10">
             <div>
                <h2 className="text-3xl font-semibold text-emerald-600 border-b border-emerald-600 pb-2 flex items-center justify-between mb-4 px-2">
                   Teachers
                </h2>
                <div className="flex items-center gap-4 p-4 hover:bg-[var(--surface-2)] rounded-xl transition-colors">
                   <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                      {classInfo.teacherName.charAt(0)}
                   </div>
                   <span className="font-semibold text-[var(--color-ink)]">{classInfo.teacherName}</span>
                </div>
             </div>

             <div>
                <h2 className="text-3xl font-semibold text-emerald-600 border-b border-emerald-600 pb-2 flex items-center justify-between mb-4 px-2">
                   Classmates
                   <span className="text-sm font-bold opacity-80">{classmates.length} students</span>
                </h2>
                <div className="grid gap-0">
                   {classmates.map(student => (
                      <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-[var(--surface-2)] rounded-xl transition-colors border-b border-[var(--color-line)] last:border-0">
                         {student.photoUrl ? (
                            <img src={student.photoUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                         ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] border border-[var(--color-line)] flex items-center justify-center font-bold text-[var(--color-muted)] shadow-sm">
                               {student.fullName.charAt(0)}
                            </div>
                         )}
                         <span className="font-medium text-[var(--color-ink)]">{student.fullName}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
