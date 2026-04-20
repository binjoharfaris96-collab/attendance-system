"use client";

import { useState } from "react";
import { linkUserToStudentAction } from "@/app/actions/admin";
import { Link2, Trash2, CheckCircle2 } from "lucide-react";

interface UserEntry {
  id: string;
  email: string;
  fullName: string;
}

export function StudentLinkingForm({ 
  studentId, 
  currentUserId, 
  currentUserEmail, 
  unlinkedUsers 
}: { 
  studentId: string;
  currentUserId: string | null;
  currentUserEmail: string | null;
  unlinkedUsers: UserEntry[];
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLink(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await linkUserToStudentAction(formData);
    if (result.error) setError(result.error);
    setIsPending(false);
  }

  async function handleUnlink() {
    setIsPending(true);
    setError(null);
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("userId", ""); // Empty userId means unlink
    const result = await linkUserToStudentAction(formData);
    if (result.error) setError(result.error);
    setIsPending(false);
  }

  return (
    <div className="card space-y-4 border-t-4 border-t-[var(--color-ink)]">
      <div className="flex items-center space-x-2">
        <Link2 className="w-5 h-5 text-[var(--color-muted)]" />
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Digital Account Link</h2>
      </div>

      {currentUserId ? (
        <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl group">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-ink)]">{currentUserEmail}</p>
              <p className="text-xs text-[var(--color-muted)]">Linked to student portal</p>
            </div>
          </div>
          <button 
            onClick={handleUnlink}
            disabled={isPending}
            className="p-2 text-[color-mix(in_srgb,var(--color-red)_90%,white)] hover:bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
            title="Unlink account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form action={handleLink} className="space-y-3">
          <input type="hidden" name="studentId" value={studentId} />
          <p className="text-sm text-[var(--color-muted)]">
            This student has not yet been bound to a login account. Select a verified user to enable their portal access.
          </p>
          
          <div className="flex gap-2">
            <select name="userId" required className="flex-1 input">
              <option value="">Select unlinked student...</option>
              {unlinkedUsers.map(u => (
                <option key={u.id} value={u.id}>{u.email} ({u.fullName})</option>
              ))}
            </select>
            <button 
              type="submit" 
              disabled={isPending || unlinkedUsers.length === 0}
              className="btn btn--primary"
            >
              {isPending ? "..." : "Link"}
            </button>
          </div>
          {unlinkedUsers.length === 0 && (
             <p className="text-[10px] text-[var(--color-muted)] italic">No unlinked student accounts found. Users must sign up first.</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
