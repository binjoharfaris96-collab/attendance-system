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

  async function handleLink(formData: FormData) {
    setIsPending(true);
    setError(null);
    let result;
    if (profile.type === "teacher") {
      result = await linkUserToTeacherAction(formData);
    } else {
      result = await linkUserToStudentAction(formData);
    }
    if (result.error) setError(result.error);
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
    <div className="flex items-center justify-between p-4 border-b border-[var(--color-line)] last:border-0 hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] transition-colors">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-accent)]">
            {profile.type === "teacher" ? <UserCircle className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[var(--color-ink)] truncate">{profile.fullName}</h3>
            <p className="text-xs text-[var(--color-muted)] flex items-center gap-1">
              {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} ID: <span className="font-mono">{profile.id.substring(0,6)}...</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-sm ml-auto">
        {profile.userId ? (
          <div className="flex items-center justify-between p-2 bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] border border-[color-mix(in_srgb,var(--secondary)_20%,transparent)] rounded-lg group">
            <div className="flex items-center gap-2 overflow-hidden">
              <CheckCircle2 className="w-4 h-4 text-[var(--secondary)] shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-[var(--color-ink)] truncate">{profile.userEmail}</p>
                <p className="text-[10px] text-[var(--secondary)]">Linked Account</p>
              </div>
            </div>
            <button 
              onClick={handleUnlink}
              disabled={isPending}
              className="p-1.5 text-red-600 hover:bg-[color-mix(in_srgb,red_10%,transparent)] rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0 ml-2"
              title="Unlink account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form action={handleLink} className="flex gap-2">
            <input type="hidden" name={profile.type === "teacher" ? "teacherId" : "studentId"} value={profile.id} />
            <select name="userId" required className="flex-1 input h-9 text-xs py-1" disabled={isPending}>
              <option value="">Select unlinked...</option>
              {unlinkedUsers.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            <button 
              type="submit" 
              disabled={isPending || unlinkedUsers.length === 0}
              className="btn btn--primary h-9 px-3 text-xs w-[60px]"
            >
              {isPending ? "..." : "Link"}
            </button>
          </form>
        )}
        {error && <p className="text-[10px] text-red-600 mt-1 absolute">{error}</p>}
      </div>
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
