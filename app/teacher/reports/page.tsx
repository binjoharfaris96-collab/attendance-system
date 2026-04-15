import { requireSession } from "@/lib/auth";
import { 
  getTeacherByUserId, 
  getUserByEmail, 
  getTeacherClasses 
} from "@/lib/db";
import { AlertCircle, FileBarChart, Download, Users, School } from "lucide-react";
import { ReportGenerator } from "@/components/admin/report-generator";

export default async function TeacherReportsPage() {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const teacherProfile = user ? await getTeacherByUserId(user.id) : null;

  if (!teacherProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to access reports.</p>
      </div>
    );
  }

  const teacherClasses = await getTeacherClasses(teacherProfile.id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-center gap-3 mb-2">
           <FileBarChart className="w-8 h-8 text-[var(--color-accent)]" />
           <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-ink)]">
             Roster Reports
           </h1>
        </div>
        <p className="text-lg text-[var(--color-muted)]">
          Export and analyze attendance data for your assigned classes.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
         <div className="md:col-span-2 space-y-6">
            <ReportGenerator 
               classes={teacherClasses.map(c => ({ id: c.id, name: c.name }))} 
            />
            
            <div className="card bg-[var(--surface-2)] border-dashed border-2 border-[var(--color-line)] p-8 flex flex-col items-center text-center">
               <Download className="w-12 h-12 text-[var(--color-muted)] mb-4 opacity-50" />
               <h3 className="text-lg font-bold text-[var(--color-ink)]">Automated Monthly Summaries</h3>
               <p className="text-sm text-[var(--color-muted)] max-w-xs mt-2">
                  Coming soon: Monthly attendance summaries delivered directly to your faculty email.
               </p>
            </div>
         </div>

         <div className="space-y-6">
            <div className="card bg-[var(--color-accent)] text-white p-6 relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <School className="w-24 h-24" />
               </div>
               <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Active Classes</p>
                  <p className="text-4xl font-black">{teacherClasses.length}</p>
                  <div className="mt-4 flex flex-col gap-2">
                     {teacherClasses.map(c => (
                        <div key={c.id} className="flex items-center justify-between text-[10px] bg-black/10 p-2 rounded-lg font-bold uppercase">
                           <span>{c.name}</span>
                           <span className="flex items-center gap-1 opacity-70">
                              <Users className="w-2 h-2" />
                              {c.studentCount}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="card p-6 space-y-4">
               <h4 className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Reporting Policy
               </h4>
               <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Attendance records are stored for 5 years. Any corrections to historical logs must be approved by the Department Head.
               </p>
               <button className="text-[10px] font-bold text-[var(--color-accent)] uppercase hover:underline">
                  Read full policy
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
