import { requireSession } from "@/lib/auth";
import { getStudentByUserId, getUserByEmail, getStudentClasses, getStudentAssignments } from "@/lib/db";
import { AlertCircle, Folder, MoreVertical, Contact, ClipboardList } from "lucide-react";
import Link from "next/link";
import { listParentRequestsForStudent } from "@/lib/db";
import { updateParentRequestAction } from "@/app/actions/parent";

const colorThemes = [
  "bg-blue-600 text-white border-blue-700",
  "bg-emerald-600 text-white border-emerald-700",
  "bg-indigo-600 text-white border-indigo-700",
  "bg-rose-600 text-white border-rose-700",
  "bg-amber-600 text-white border-amber-700",
  "bg-purple-600 text-white border-purple-700",
];

export default async function StudentPortalPage() {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;
  
  if (!studentProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12">
        <div className="p-8 rounded-2xl border-2 border-dashed border-[var(--color-line)] bg-[var(--surface-1)] text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[var(--color-danger)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
          <p className="text-[var(--color-muted)] max-w-md mx-auto">
            You are logged in as <span className="font-medium text-[var(--color-ink)]">{session.email}</span>, but your account has not been bound to a physical attendance record yet. 
          </p>
        </div>
      </div>
    );
  }

  const enrolledClasses = await getStudentClasses(studentProfile.id);
  const assignments = await getStudentAssignments(studentProfile.id);
  
  // Pending Parent Requests logic kept for functionality
  const parentRequests = await listParentRequestsForStudent(studentProfile.id);
  const pendingRequests = parentRequests.filter(req => req.status === "pending");

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {pendingRequests.length > 0 && (
        <section className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-blue-700 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Connection Requests</span>
          </h2>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--color-line)]">
                <div>
                  <p className="font-bold text-[var(--color-ink)]">{req.parentName}</p>
                  <p className="text-sm text-[var(--color-muted)]">{req.parentEmail} is requesting access.</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <form action={updateParentRequestAction}>
                     <input type="hidden" name="requestId" value={req.id} />
                     <input type="hidden" name="status" value="rejected" />
                     <button type="submit" className="btn bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white border-none py-1.5 px-3 text-xs font-bold">Reject</button>
                  </form>
                  <form action={updateParentRequestAction}>
                     <input type="hidden" name="requestId" value={req.id} />
                     <input type="hidden" name="status" value="approved" />
                     <button type="submit" className="btn btn--primary py-1.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">Approve</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {enrolledClasses.length === 0 ? (
        <div className="p-12 text-center text-[var(--color-muted)] border-2 border-dashed border-[var(--color-line)] rounded-3xl">
          You are not enrolled in any classes yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrolledClasses.map((c, index) => {
             const theme = colorThemes[index % colorThemes.length];
             const dueSoon = assignments.filter(a => a.className === c.name && a.status === "Not Submitted").slice(0, 2);

             return (
               <div key={c.id} className="rounded-xl overflow-hidden border border-[var(--color-line)] bg-[var(--surface-1)] shadow-sm hover:shadow-md transition-shadow relative flex flex-col h-[300px]">
                 
                 {/* Top Colored Header */}
                 <div className={`h-24 ${theme} p-4 relative`}>
                   <div className="flex justify-between items-start">
                     <div className="flex-1 min-w-0 pr-4 hover:underline cursor-pointer">
                       <Link href={`/student/classes/${c.id}`} className="block">
                         <h2 className="text-lg font-bold truncate leading-tight">{c.name}</h2>
                         {c.subject && <p className="text-xs opacity-90 truncate mt-1">{c.subject}</p>}
                       </Link>
                     </div>
                     <button className="text-white/80 hover:text-white shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors">
                       <MoreVertical className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <p className="text-xs opacity-90 mt-2 truncate hover:underline cursor-pointer">
                      {c.teacherName}
                   </p>
                 </div>

                 {/* Avatar Overflow */}
                 <div className="absolute right-4 top-16 w-16 h-16 rounded-full border-4 border-[var(--surface-1)] bg-[var(--surface-2)] flex items-center justify-center overflow-hidden shadow-sm z-10">
                    <span className="text-2xl font-black text-[var(--color-muted)]">
                       {c.teacherName.charAt(0)}
                    </span>
                 </div>

                 {/* Middle: Upcoming Assignments */}
                 <div className="flex-1 p-4 pt-12 text-sm">
                    {dueSoon.length > 0 ? (
                      <div className="space-y-3">
                         {dueSoon.map(a => (
                           <Link key={a.id} href={`/student/classes/${c.id}?tab=classwork`} className="block group">
                              <p className="text-xs font-semibold text-[var(--color-ink)] group-hover:underline truncate">{a.title}</p>
                              <p className="text-[10px] text-[var(--color-muted)]">Due {new Date(a.dueDate).toLocaleDateString()}</p>
                           </Link>
                         ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                         <p className="text-xs text-[var(--color-muted)]">Woohoo, no work due soon!</p>
                      </div>
                    )}
                 </div>

                 {/* Bottom Actions Footer */}
                 <div className="h-12 border-t border-[var(--color-line)] flex items-center justify-end px-4 gap-4">
                    <Link href={`/student/classes/${c.id}?tab=classwork`} className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors p-1" title="Open your work for this class">
                       <Contact className="w-5 h-5" />
                    </Link>
                    <Link href={`/student/classes/${c.id}?tab=classwork`} className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors p-1" title="Open folder for this class">
                       <Folder className="w-5 h-5" />
                    </Link>
                 </div>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
