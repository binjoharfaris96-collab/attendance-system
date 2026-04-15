"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { createClassAction } from "@/app/actions/admin";

interface TeacherOption {
  id: string;
  fullName: string;
}

export function ClassForm({ teachers }: { teachers: TeacherOption[] }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await createClassAction(formData);
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      (document.getElementById("class-form") as HTMLFormElement)?.reset();
      setIsPending(false);
    }
  }

  return (
    <div className="card space-y-4 h-fit border-t-4 border-t-purple-500">
      <div className="flex items-center space-x-2 text-purple-600">
        <PlusCircle className="w-5 h-5" />
        <h2 className="text-lg font-bold">New Class</h2>
      </div>
      <form id="class-form" action={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Class Name</label>
          <input name="name" required className="input w-full" placeholder="e.g. Mathematics 10A" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Subject</label>
          <input name="subject" className="input w-full" placeholder="e.g. Calculus" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Assigned Teacher</label>
          <select name="teacherId" required className="input w-full">
            <option value="">Select a teacher...</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.fullName}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button 
          type="submit" 
          disabled={isPending || teachers.length === 0}
          className="btn btn--primary w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Class"}
        </button>
        {teachers.length === 0 && (
          <p className="text-[10px] text-amber-600 italic">You must add teachers first before creating classes.</p>
        )}
      </form>
    </div>
  );
}
