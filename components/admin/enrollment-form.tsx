"use client";

import { useState } from "react";
import { UserPlus, Search, X } from "lucide-react";
import { enrollStudentAction } from "@/app/actions/admin";

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
}

export function EnrollmentForm({ 
  classId, 
  availableStudents 
}: { 
  classId: string; 
  availableStudents: StudentOption[];
}) {
  const [isPending, setIsPending] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = availableStudents
    .filter(s => 
      s.fullName.toLowerCase().includes(search.toLowerCase()) || 
      s.studentCode.includes(search)
    )
    .slice(0, 5);

  async function handleEnroll(studentId: string) {
    setIsPending(true);
    setError(null);
    const formData = new FormData();
    formData.append("classId", classId);
    formData.append("studentId", studentId);
    
    const result = await enrollStudentAction(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setSearch("");
    }
    setIsPending(false);
  }

  return (
    <div className="card space-y-4 shadow-lg border-purple-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-[var(--color-ink)]">
          <UserPlus className="w-4 h-4 text-purple-600" />
          Enroll Students
        </h3>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[var(--color-muted)]" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 w-full"
          placeholder="Search by name or student code..."
        />
        {search && (
          <button 
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            <X className="h-4 w-4 text-[var(--color-muted)]" />
          </button>
        )}
      </div>

      {search && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] italic p-2">No matching students found.</p>
          ) : (
            filtered.map(student => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-line)] bg-[var(--surface-2)] hover:border-purple-300 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-[var(--color-ink)]">{student.fullName}</p>
                  <p className="text-[10px] font-mono text-[var(--color-muted)]">{student.studentCode}</p>
                </div>
                <button
                  onClick={() => handleEnroll(student.id)}
                  disabled={isPending}
                  className="btn btn--primary py-1 px-3 text-xs bg-purple-600 hover:bg-purple-700"
                >
                  {isPending ? "..." : "Enroll"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
