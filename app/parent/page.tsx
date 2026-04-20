import { requireSession } from "@/lib/auth";
import { getUserByEmail, listStudents, listParentRequestsForParent, getStudentById } from "@/lib/db";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { sendParentRequestAction } from "@/app/actions/parent";
import { SearchableStudentSelect } from "@/components/searchable-student-select";

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

  // Get full student details for approved students
  const approvedStudents = await Promise.all(
    approvedRequests.map(async req => {
      return await getStudentById(req.studentId);
    })
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)] mb-2">
          Your Connected Students
        </h1>
        <p className="text-[var(--color-muted)]">
          Manage and monitor your children's academic performance and attendance.
        </p>
      </header>

      {/* Approved Students */}
      <section>
        <h2 className="text-xl font-bold mb-4">Approved Student Profiles</h2>
        {approvedStudents.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-[var(--color-line)] text-center text-[var(--color-muted)]">
            You don't have any approved student links yet. Send a request below!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {approvedStudents.map(student => student && (
              <div key={student.id} className="card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-ink)]">{student.fullName}</h3>
                  <p className="text-sm font-mono text-[var(--color-muted)]">{student.studentCode}</p>
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Absences:</span>
                      <span className="font-bold">{student.excusesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-muted)]">Lates:</span>
                      <span className="font-bold">{student.latesCount}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--color-line)]">
                   <button className="btn btn--outline w-full text-xs">View Full Report (Coming Soon)</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-amber-600 mb-2">Pending Requests</h2>
          <ul className="space-y-2">
            {pendingRequests.map(req => (
              <li key={req.id} className="text-sm text-amber-700 font-medium">
                Waiting for <b>{req.studentName}</b> to approve your request.
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Send a Request */}
      <section className="card p-6 mt-8 border-t-4 border-t-blue-500">
        <h2 className="text-xl font-bold mb-2">Link a New Student</h2>
        <p className="text-sm text-[var(--color-muted)] mb-6">Select a student from the directory to send them a connection request.</p>
        
        <form action={sendParentRequestAction} className="flex gap-2 max-w-md items-start">
          <SearchableStudentSelect students={allStudents.map(s => ({ id: s.id, fullName: s.fullName, studentCode: s.studentCode }))} />
          <button type="submit" className="btn btn--primary mt-[2px]">Send Request</button>
        </form>
      </section>

    </div>
  );
}
