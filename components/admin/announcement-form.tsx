"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { createAnnouncementAction } from "@/app/actions/admin";

export function AnnouncementForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await createAnnouncementAction(formData);
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      // Form resets on success thanks to revalidation or manual reset
      // Actually server actions don't reset DOM automatically, but being a client component we can control it.
      (document.getElementById("announcement-form") as HTMLFormElement)?.reset();
      setIsPending(false);
    }
  }

  return (
    <div className="card space-y-4 h-fit border-t-4 border-t-amber-500">
      <div className="flex items-center space-x-2 text-amber-600">
        <PlusCircle className="w-5 h-5" />
        <h2 className="text-lg font-bold">New Post</h2>
      </div>
      <form id="announcement-form" action={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Title</label>
          <input name="title" required className="input w-full" placeholder="e.g. End of Term Holidays" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Target Audience</label>
          <select name="targetRole" className="input w-full">
            <option value="all">Everyone (All Portals)</option>
            <option value="student">Students Only</option>
            <option value="teacher">Teachers Only</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Content</label>
          <textarea name="content" required className="input w-full min-h-[120px]" placeholder="Write your message here..." />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button 
          type="submit" 
          disabled={isPending}
          className="btn btn--primary w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post Announcement"}
        </button>
      </form>
    </div>
  );
}
