"use client";

import { useState } from "react";
import { PlusCircle, CalendarPlus } from "lucide-react";
import { createAssignment } from "@/app/actions/assignments";

interface ClassEntry {
  id: string;
  name: string;
}

export function AssignmentForm({ classes }: { classes: ClassEntry[] }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setMessage(null);

    try {
      const result = await createAssignment(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Assignment posted successfully!" });
        // Optionally reset form if it wasn't a redirect
        (document.getElementById("assignment-form") as HTMLFormElement)?.reset();
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="card p-6 sticky top-8 border-t-4 border-t-[var(--color-accent)]">
      <div className="flex items-center space-x-2 mb-4">
        <CalendarPlus className="text-[var(--color-accent)] w-5 h-5" />
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Dispatch Task</h2>
      </div>

      {classes.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)] p-4 bg-[var(--surface-2)] rounded-lg text-center">
          You must be assigned to at least one class to create assignments.
        </div>
      ) : (
        <form id="assignment-form" action={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-ink)]">Class</label>
            <select name="classId" required className="w-full input">
              <option value="">Select a class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-ink)]">Title</label>
            <input
              type="text"
              name="title"
              required
              className="w-full input"
              placeholder="e.g. Chapter 4 Quiz"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-ink)]">Due Date</label>
            <input type="date" name="dueDate" required className="w-full input" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-ink)]">Description</label>
            <textarea
              name="description"
              rows={3}
              className="w-full input resize-none"
              placeholder="Task requirements..."
            ></textarea>
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-600"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center space-x-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>{isPending ? "Posting..." : "Post Assignment"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
