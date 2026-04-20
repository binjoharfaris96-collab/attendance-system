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
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredUsers = unlinkedUsers.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Search by email or name..." 
              className="field-input w-full text-sm" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            
            <div className="max-h-[160px] overflow-y-auto border border-[var(--color-line)] rounded-xl bg-[var(--surface-1)]">
               {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--color-muted)]">No users found matching "{searchTerm}"</div>
               ) : (
                  filteredUsers.map(u => (
                    <label key={u.id} className="flex items-start gap-3 p-3 hover:bg-[var(--surface-2)] cursor-pointer border-b border-[var(--color-line)] last:border-0 transition-colors">
                      <input type="radio" name="userId" value={u.id} required className="mt-1" />
                      <div>
                         <div className="font-bold text-sm text-[var(--color-ink)]">{u.email}</div>
                         <div className="text-xs text-[var(--color-muted)] font-medium">{u.fullName}</div>
                      </div>
                    </label>
                  ))
               )}
            </div>
            
            <button 
              type="submit" 
              disabled={isPending || unlinkedUsers.length === 0}
              className="btn btn--primary w-full justify-center"
            >
              {isPending ? "Linking account..." : "Link Selected Account"}
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
