"use client";

import { useState } from "react";
import { linkUserToTeacherAction } from "@/app/actions/admin";
import { Link2, Trash2, CheckCircle2 } from "lucide-react";

interface UserEntry {
  id: string;
  email: string;
  fullName: string;
}

export function TeacherLinkingForm({ 
  teacherId, 
  currentUserId, 
  currentUserEmail, 
  unlinkedUsers 
}: { 
  teacherId: string;
  currentUserId: string | null;
  currentUserEmail: string | null;
  unlinkedUsers: UserEntry[];
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLink(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await linkUserToTeacherAction(formData);
    if (result.error) setError(result.error);
    setIsPending(false);
  }

  async function handleUnlink() {
    setIsPending(true);
    setError(null);
    const formData = new FormData();
    formData.append("teacherId", teacherId);
    formData.append("userId", ""); // Empty userId means unlink
    const result = await linkUserToTeacherAction(formData);
    if (result.error) setError(result.error);
    setIsPending(false);
  }

  return (
    <div className="card space-y-4 border-t-4 border-t-blue-500">
      <div className="flex items-center space-x-2">
        <Link2 className="w-5 h-5 text-[var(--color-muted)]" />
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Digital Account Link</h2>
      </div>

      {currentUserId ? (
        <div className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl group">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/10 p-2 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-ink)]">{currentUserEmail}</p>
              <p className="text-xs text-[var(--color-muted)]">Linked to teacher portal</p>
            </div>
          </div>
          <button 
            onClick={handleUnlink}
            disabled={isPending}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
            title="Unlink account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form action={handleLink} className="space-y-3">
          <input type="hidden" name="teacherId" value={teacherId} />
          <p className="text-sm text-[var(--color-muted)]">
            This faculty record is not yet bound to a login account. Select a verified user (e.g. @kfs.sch.sa) to enable their portal access.
          </p>
          
          <div className="flex gap-2">
            <select name="userId" required className="flex-1 input">
              <option value="">Select unlinked staff...</option>
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
             <p className="text-[10px] text-[var(--color-muted)] italic">No unlinked teacher accounts found. Staff must sign up first.</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
