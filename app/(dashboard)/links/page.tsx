import { requireSession } from "@/lib/auth";
import { 
  listTeachers, 
  listStudents,
  getUnlinkedUsers
} from "@/lib/db";
import { UnifiedLinkList } from "@/components/admin/unified-link-list";

export const dynamic = "force-dynamic";

export default async function LinksDashboardPage() {
  const session = await requireSession();
  
  // Hard security wall
  if (session.role !== "admin") {
    return (
      <div className="p-8 text-center text-red-600 font-bold border rounded-lg bg-red-50">
        Access Denied. You lack physiological clearance for Identity Management.
      </div>
    );
  }

  // Fetch all necessary rosters
  const rawTeachers = await listTeachers();
  const rawStudents = await listStudents();
  
  const unlinkedTeachers = await getUnlinkedUsers("teacher");
  const unlinkedStudents = await getUnlinkedUsers("student");

  // Standardize the shape before passing to client UI
  const teachers = rawTeachers.map(t => ({
    id: t.id,
    fullName: t.fullName,
    userId: t.userId ?? null,
    userEmail: t.userEmail ?? null,
    type: "teacher" as const
  }));

  const students = rawStudents.map(s => ({
    id: s.id,
    fullName: s.fullName,
    userId: s.userId ?? null,
    userEmail: s.userEmail ?? null,
    type: "student" as const
  }));

  return (
    <div className="space-y-6 max-w-4xl max-w-[1000px] w-full pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          Identity Map
        </h1>
        <p className="text-[var(--color-muted)] mt-1">
          Unify physical database records with authentication tokens across the entire platform.
        </p>
      </div>

      <UnifiedLinkList 
        teachers={teachers} 
        students={students} 
        unlinkedTeachers={unlinkedTeachers} 
        unlinkedStudents={unlinkedStudents} 
      />
    </div>
  );
}
