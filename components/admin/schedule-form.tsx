"use client";

import { useActionState } from "react";
import { createScheduleAction } from "@/app/actions/admin";
import { Calendar, User, Clock, Book } from "lucide-react";

export function ScheduleForm({ 
  classes, 
  teachers 
}: { 
  classes: { id: string; name: string }[];
  teachers: { id: string; fullName: string }[];
}) {
  const [state, action, isPending] = useActionState(async (prev: any, formData: FormData) => {
    return await createScheduleAction(formData);
  }, null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Class Section</label>
        <div className="relative">
          <Book className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-muted)]" />
          <select 
            name="classId" 
            required 
            className="input pl-10 h-10 text-sm appearance-none bg-[var(--surface-1)]"
          >
            <option value="">Select a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Teacher / Instructor</label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--color-muted)]" />
          <select 
            name="teacherId" 
            required 
            className="input pl-10 h-10 text-sm appearance-none bg-[var(--surface-1)]"
          >
            <option value="">Select a teacher...</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Subject Name</label>
        <div className="relative">
           <div className="absolute left-3 top-2.5 w-4 h-1 text-[var(--color-muted)] border-b-2 border-current"></div>
           <input 
             name="subject" 
             placeholder="e.g. Mathematics" 
             required 
             className="input pl-10 h-10 text-sm"
           />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Day</label>
          <select name="dayOfWeek" required className="input h-10 text-sm bg-[var(--surface-1)]">
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
           <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Time Slot</label>
           <div className="grid grid-cols-2 gap-1">
             <input type="time" name="startTime" required className="input h-10 px-2 text-[10px]" />
             <input type="time" name="endTime" required className="input h-10 px-2 text-[10px]" />
           </div>
        </div>
      </div>

      <button disabled={isPending} className="btn btn-primary w-full h-10 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50">
        {isPending ? "Adding..." : "Add to Master Schedule"}
      </button>

      {state?.error && <p className="text-xs text-red-500 font-medium text-center">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-500 font-medium text-center">Slot added successfully!</p>}
    </form>
  );
}
