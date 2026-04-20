import { getScheduleWithAttendance } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users, Clock } from "lucide-react";
import Link from "next/link";
import { AttendanceMarker } from "@/components/teacher/attendance-marker";

export default async function AttendanceMarkingPage({ 
  params 
}: { 
  params: Promise<{ scheduleId: string }> 
}) {
  const { scheduleId } = await params;
  const today = new Date().toISOString().split('T')[0];
  const data = await getScheduleWithAttendance(scheduleId, today);

  if (!data) notFound();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between items-start">
        <div className="space-y-1">
          <Link 
            href="/teacher" 
            className="inline-flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors group mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-[var(--color-ink)]">
            Attendance Entry
          </h1>
          <div className="flex items-center gap-4 text-sm text-[var(--color-muted)] font-medium">
             <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
                {today}
             </span>
             <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-line)]"></span>
             <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                {data.className} • {data.subject}
             </span>
          </div>
        </div>

        <div className="card py-2 px-4 flex items-center gap-3">
           <Users className="w-5 h-5 text-[var(--color-accent)]" />
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Roster Size</p>
              <p className="text-xl font-black text-[var(--color-ink)]">{data.students.length}</p>
           </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-t-4 border-t-[var(--color-accent)] shadow-xl">
         <div className="p-4 bg-[var(--surface-2)] border-b border-[var(--color-line)]">
            <h3 className="font-bold text-[var(--color-ink)]">Student Attendance List</h3>
         </div>
         <AttendanceMarker 
           students={data.students.map(s => ({
             id: s.id,
             fullName: s.fullName,
             studentCode: s.studentCode,
             attendance: s.status ? { status: s.status, notes: s.attendanceNotes } : null
           }))} 
           scheduleId={scheduleId} 
           date={today} 
         />
      </div>
    </div>
  );
}
