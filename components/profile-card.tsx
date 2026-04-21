"use client";

import { useState } from "react";
import { updateUserPhotoAction } from "@/app/actions/user";
import { Camera, CheckCircle2, User } from "lucide-react";

export function ProfileCard({ user }: { user: { fullName: string; email: string; photoUrl?: string | null; role: string } }) {
  const [isEditing, setIsEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setIsPending(true);
    const formData = new FormData();
    formData.append("photoUrl", photoUrl);
    
    const res = await updateUserPhotoAction(formData);
    setIsPending(false);
    if (res.success) {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="card p-6 bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)] border border-[var(--color-line)] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <User className="w-24 h-24" />
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative group">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-4 ring-[var(--color-accent)]/20 shadow-xl" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg shadow-[var(--color-accent)]/20">
              {user.fullName.charAt(0)}
            </div>
          )}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--surface-1)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-accent)] shadow-sm transition-all hover:scale-110"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{user.fullName}</h2>
          <p className="text-sm text-[var(--color-muted)] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-wider">
              {user.role}
            </span>
            <span>{user.email}</span>
          </p>
          {success && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 animate-in fade-in slide-in-from-left-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>Profile updated successfully!</span>
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--color-line)] space-y-4 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">Profile Photo URL</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full input text-xs py-2 bg-[var(--surface-1)]"
              />
              <button 
                onClick={handleSave}
                disabled={isPending}
                className="btn btn--primary py-2 px-4 text-xs font-bold whitespace-nowrap shadow-none"
              >
                {isPending ? "Updating..." : "Save Photo"}
              </button>
            </div>
            <p className="text-[9px] text-[var(--color-muted)] px-1 pt-1 italic">Please provide a direct image link (JPEG/PNG).</p>
          </div>
        </div>
      )}
    </div>
  );
}
