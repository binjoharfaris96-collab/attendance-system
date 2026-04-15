"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { createTeacherAction } from "@/app/actions/admin";

export function TeacherForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await createTeacherAction(formData);
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      (document.getElementById("teacher-form") as HTMLFormElement)?.reset();
      setIsPending(false);
    }
  }

  return (
    <div className="card space-y-4 h-fit">
      <div className="flex items-center space-x-2">
        <PlusCircle className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-bold">Add New Teacher</h2>
      </div>
      <form id="teacher-form" action={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Full Name</label>
          <input name="fullName" required className="input w-full" placeholder="e.g. Dr. Sarah Smith" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Department</label>
          <input name="department" className="input w-full" placeholder="e.g. Mathematics" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button 
          type="submit" 
          disabled={isPending}
          className="btn btn--primary w-full disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Record"}
        </button>
      </form>
    </div>
  );
}
