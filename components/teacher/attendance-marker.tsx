"use client";

import { useTransition, useState } from "react";
import { markManualAttendanceAction } from "@/app/actions/attendance";
import { CheckCircle2, XCircle, Clock, FileText, Activity, Loader2 } from "lucide-react";

type StudentAttendance = {
  id: string;
  fullName: string;
  studentCode: string;
  attendance: { status: string; notes: string | null } | null;
};

export function AttendanceMarker({ 
  students, 
  scheduleId, 
  date 
}: { 
  students: StudentAttendance[];
  scheduleId: string;
  date: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const statuses = [
    { id: "Present", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    { id: "Absent", icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
    { id: "Late", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    { id: "Excused", icon: FileText, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { id: "Doctor", icon: Activity, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  ];

  const handleMark = (studentId: string, status: string) => {
    setPendingId(`${studentId}-${status}`);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("scheduleId", scheduleId);
      formData.append("date", date);
      formData.append("status", status);
      
      const result = await markManualAttendanceAction(formData);
      if (result.error) alert(result.error);
      setPendingId(null);
    });
  };

  return (
    <div className="divide-y divide-[var(--color-line)]">
      {students.map((student) => (
        <div key={student.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-[var(--surface-1)] transition-colors">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[var(--color-ink)] border border-[var(--color-line)]">
                {student.fullName.charAt(0)}
             </div>
             <div>
                <p className="font-bold text-[var(--color-ink)]">{student.fullName}</p>
                <p className="text-[10px] uppercase tracking-tighter text-[var(--color-muted)] font-black">{student.studentCode}</p>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {statuses.map((s) => {
              const isActive = student.attendance?.status === s.id;
              const isThisPending = pendingId === `${student.id}-${s.id}`;
              
              return (
                <button
                  key={s.id}
                  disabled={isPending}
                  onClick={() => handleMark(student.id, s.id)}
                  className={`
                    relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95
                    ${isActive 
                      ? `${s.bg} ${s.color} ${s.border} shadow-sm ring-2 ring-current ring-offset-2 ring-offset-[var(--surface-1)]` 
                      : "bg-[var(--surface-1)] text-[var(--color-muted)] border-[var(--color-line)] hover:border-[var(--color-muted)] hover:text-[var(--color-ink)]"
                    }
                    ${isPending && !isThisPending ? "opacity-50 pointer-events-none" : ""}
                  `}
                >
                  {isThisPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <s.icon className={`w-4 h-4 ${isActive ? s.color : "text-current"}`} />
                  )}
                  <span className="hidden sm:inline">{s.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {students.length === 0 && (
        <div className="p-12 text-center text-[var(--color-muted)] italic">
          No students found in this class roster.
        </div>
      )}
    </div>
  );
}
