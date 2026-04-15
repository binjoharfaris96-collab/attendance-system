import { requireSession } from "@/lib/auth";
import { getUserByEmail, getStudentByUserId, getStudentAttendanceEvents } from "@/lib/db";
import { AlertCircle, Clock, CalendarCheck } from "lucide-react";

export default async function StudentAttendancePage() {
  const session = await requireSession();
  const user = await getUserByEmail(session.email);
  const studentProfile = user ? await getStudentByUserId(user.id) : null;

  if (!studentProfile) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-12 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Account Not Linked</h1>
        <p className="text-[var(--color-muted)] mt-2">Your account must be linked by an administrator to view attendance logs.</p>
      </div>
    );
  }

  const events = await getStudentAttendanceEvents(studentProfile.id, 100);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <CalendarCheck className="w-8 h-8 text-[var(--color-accent)]" />
        <h1 className="text-3xl font-bold text-[var(--color-ink)]">Attendance Log</h1>
      </div>

      <div className="card overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-muted)] flex flex-col items-center">
            <Clock className="w-12 h-12 mb-4 opacity-50" />
            <p>No attendance records found for this term.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-1)] border-b border-[var(--color-line)]">
                <th className="p-4 font-semibold text-[var(--color-muted)]">Date</th>
                <th className="p-4 font-semibold text-[var(--color-muted)]">Time Scanned</th>
                <th className="p-4 font-semibold text-[var(--color-muted)]">Source</th>
                <th className="p-4 font-semibold text-[var(--color-muted)]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)] text-[var(--color-ink)]">
              {events.map((event) => {
                const captured = new Date(event.capturedAt);
                const isLate = captured.getHours() >= 8 && captured.getMinutes() > 0; // standard arbitrary logic based on previous system
                
                return (
                  <tr key={event.id} className="hover:bg-[var(--surface-1)]/50 transition-colors">
                    <td className="p-4 font-medium">{event.attendanceDate}</td>
                    <td className="p-4">
                      {captured.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 capitalize">{event.source.replace("_", " ")}</td>
                    <td className="p-4">
                      {isLate ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                          Late
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                          On Time
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
