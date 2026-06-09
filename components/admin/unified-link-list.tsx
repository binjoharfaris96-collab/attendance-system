"use client";

import { useState } from "react";
import { linkUserToTeacherAction, linkUserToStudentAction } from "@/app/actions/admin";
import { Link2, Trash2, CheckCircle2, UserCircle, GraduationCap } from "lucide-react";

interface Profile {
  id: string;
  fullName: string;
  userId: string | null;
  userEmail: string | null;
  type: "teacher" | "student";
}

interface UserEntry {
  id: string;
  email: string;
  fullName: string;
}

interface UnifiedLinkListProps {
  teachers: Profile[];
  students: Profile[];
  unlinkedTeachers: UserEntry[];
  unlinkedStudents: UserEntry[];
}

function LinkRow({ 
  profile, 
  unlinkedUsers 
}: { 
  profile: Profile; 
  unlinkedUsers: UserEntry[]; 
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = unlinkedUsers.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleLink(userId: string) {
    setIsPending(true);
    setError(null);
    const formData = new FormData();
    formData.append("userId", userId);
    
    let result;
    if (profile.type === "teacher") {
      formData.append("teacherId", profile.id);
      result = await linkUserToTeacherAction(formData);
    } else {
      formData.append("studentId", profile.id);
      result = await linkUserToStudentAction(formData);
    }
    if (result.error) setError(result.error);
    setIsLinking(false);
    setIsPending(false);
  }

  async function handleUnlink() {
    setIsPending(true);
    setError(null);
    const formData = new FormData();
    if (profile.type === "teacher") {
      formData.append("teacherId", profile.id);
      formData.append("userId", "");
      const result = await linkUserToTeacherAction(formData);
      if (result.error) setError(result.error);
    } else {
      formData.append("studentId", profile.id);
      formData.append("userId", "");
      const result = await linkUserToStudentAction(formData);
      if (result.error) setError(result.error);
    }
    setIsPending(false);
  }

  return (
    <div className="flex flex-col p-4 border-b border-[var(--color-line)] last:border-0 hover:bg-[color-mix(in_srgb,var(--color-ink)_2%,transparent)] transition-colors">
      {/* Row 1: Avatar + name + action (on sm+, action is inline right; on mobile, action drops below) */}
      <div className="flex flex-col gap-2">
        {/* Name row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)] shrink-0">
            {profile.type === "teacher" ? <UserCircle className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-[var(--color-ink)] truncate">{profile.fullName}</h3>
            <p className="text-[11px] text-[var(--color-muted)]">
              {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} · <span className="font-mono">{profile.id.substring(0,8)}</span>
            </p>
          </div>
        </div>

        {/* Badge / action row — indented under the avatar */}
        <div className="ml-12">
          {profile.userId ? (
            <div className="inline-flex items-center gap-2 py-1.5 px-2.5 bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] border border-[color-mix(in_srgb,var(--secondary)_20%,transparent)] rounded-lg group">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--secondary)] shrink-0" />
              <span className="text-[11px] font-medium text-[var(--color-ink)] truncate max-w-[200px]">{profile.userEmail}</span>
              <button 
                onClick={handleUnlink}
                disabled={isPending}
                className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0 ml-1"
                title="Unlink account"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              {!isLinking ? (
                <button 
                  onClick={() => setIsLinking(true)}
                  disabled={isPending}
                  className="btn btn--outline h-8 px-3 text-xs"
                >
                  Bind Account
                </button>
              ) : (
                <button onClick={() => setIsLinking(false)} className="text-xs font-medium text-[var(--color-muted)] hover:text-red-500 py-1">
                  Cancel
                </button>
              )}
            </>
          )}
          {error && <p className="text-[10px] text-red-600 mt-1">{error}</p>}
        </div>
      </div>
      
      {/* Custom Combobox UI rendered block-level when isLinking is true */}
      {isLinking && !profile.userId && (
         <div className="mt-4 pt-4 border-t border-[var(--color-line)] animate-in fade-in slide-in-from-top-2 duration-300">
            <input 
               type="text" 
               placeholder="Search by exact email or full name..." 
               className="field-input w-full text-sm mb-2" 
               autoFocus
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="max-h-[140px] overflow-y-auto border border-[var(--color-line)] rounded-xl bg-[var(--surface-1)]">
               {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--color-muted)]">No unlinked accounts found matching your search.</div>
               ) : (
                  filteredUsers.map(u => (
                     <button 
                        key={u.id}
                        type="button"
                        onClick={() => handleLink(u.id)}
                        disabled={isPending}
                        className="w-full flex items-start gap-3 p-3 hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--surface-2))] text-left border-b border-[var(--color-line)] last:border-0 transition-colors disabled:opacity-50"
                     >
                        <div className="bg-[var(--surface-0)] rounded-full p-2 border border-[var(--color-line)]">
                           <UserCircle className="w-4 h-4 text-[var(--color-accent)]" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-[var(--color-ink)]">{u.fullName}</p>
                           <p className="text-[10px] text-[var(--color-muted)] truncate">{u.email}</p>
                        </div>
                     </button>
                  ))
               )}
            </div>
         </div>
      )}
    </div>
  );
}

export function UnifiedLinkList({ teachers, students, unlinkedTeachers, unlinkedStudents }: UnifiedLinkListProps) {
  const [activeTab, setActiveTab] = useState<"teachers" | "students">("teachers");

  const currentList = activeTab === "teachers" ? teachers : students;
  const currentUnlinkedPool = activeTab === "teachers" ? unlinkedTeachers : unlinkedStudents;

  return (
    <div className="card !p-0 overflow-hidden shadow-sm border border-[var(--color-line)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Tabs */}
      <div className="border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-ink)_2%,transparent)]">
        <div className="px-6 py-5 flex items-center gap-3">
          <div className="p-2 bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)] rounded-lg">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ink)] tracking-tight">Identity Registry</h2>
            <p className="text-xs text-[var(--color-muted)]">Bind physical school profiles to authentication accounts.</p>
          </div>
        </div>
        
        <div className="flex px-4 gap-2">
          <button 
            onClick={() => setActiveTab("teachers")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "teachers" ? "border-[var(--color-accent)] text-[var(--color-accent)]" : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] rounded-t-md"}`}
          >
            Faculty Profiles ({teachers.length})
          </button>
          <button 
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "students" ? "border-[var(--color-accent)] text-[var(--color-accent)]" : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] rounded-t-md"}`}
          >
            Student Profiles ({students.length})
          </button>
        </div>
      </div>

      {/* Roster Area */}
      <div>
        {currentList.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-muted)] text-sm">
            No profiles found in this category.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {currentList.map(profile => (
              <LinkRow key={profile.id} profile={profile} unlinkedUsers={currentUnlinkedPool} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
