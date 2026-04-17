"use client";

import { useActionState, useState } from "react";
import { registerStudentAction } from "@/app/actions/student-register";
import { createTranslator } from "@/lib/i18n";
import { 
  User, 
  Mail, 
  Lock, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Hash
} from "lucide-react";
import Link from "next/link";

export function StudentRegisterForm({ lang }: { lang: any }) {
  const t = createTranslator(lang);
  const [isSuccess, setIsSuccess] = useState(false);

  const [state, action, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const result = await registerStudentAction(formData);
    if (result.success) {
      setIsSuccess(true);
      return null;
    }
    return result;
  }, null);

  if (isSuccess) {
    return (
      <div className="text-center py-8 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-3">
          {t("register.successTitle")}
        </h2>
        <p className="text-[var(--color-muted)] mb-8 max-w-sm mx-auto">
          {t("register.successSubtitle")}
        </p>
        <Link 
          href="/login" 
          className="btn btn-primary w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group shadow-xl shadow-blue-500/20"
        >
          {t("register.goToLogin")}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">
            {t("register.fullName")}
          </label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] transition-colors group-focus-within:text-[var(--color-accent)]" />
            <input 
              name="fullName" 
              required 
              placeholder="e.g. John Doe"
              className="w-full bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none"
            />
          </div>
        </div>

        {/* Student ID */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">
            {t("register.studentId")}
          </label>
          <div className="relative group">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] transition-colors group-focus-within:text-[var(--color-accent)]" />
            <input 
              name="studentCode" 
              required 
              placeholder="e.g. 2024-001"
              className="w-full bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">
            {t("register.email")}
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] transition-colors group-focus-within:text-[var(--color-accent)]" />
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="name@school.edu"
              className="w-full bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">
            {t("register.password")}
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] transition-colors group-focus-within:text-[var(--color-accent)]" />
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="Min 8 characters"
              className="w-full bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">
          {t("register.dob")}
        </label>
        <div className="relative group">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] transition-colors group-focus-within:text-[var(--color-accent)]" />
          <input 
            name="dateOfBirth" 
            type="date" 
            required 
            className="w-full bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--color-line)]">
         <div className="flex items-center gap-2 mb-4 text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-widest overflow-hidden">
            <span className="whitespace-nowrap px-1">Parent / Guardian Information</span>
            <div className="w-full h-[1px] bg-[var(--color-line)]"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Parent Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">
                {t("register.parentName")}
              </label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] transition-colors group-focus-within:text-[var(--color-accent)]" />
                <input 
                  name="parentName" 
                  required 
                  className="w-full bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none"
                />
              </div>
            </div>

            {/* Parent Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">
                {t("register.parentPhone")}
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] transition-colors group-focus-within:text-[var(--color-accent)]" />
                <input 
                  name="parentPhone" 
                  required 
                  placeholder="+966 5..."
                  className="w-full bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl pl-12 pr-4 py-3.5 text-sm transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none"
                />
              </div>
            </div>
         </div>
      </div>

      <button 
        disabled={isPending}
        className="btn btn-primary w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20"
      >
        {isPending ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>{t("register.submit")}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {state?.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold animate-in shake duration-300">
           {state.error}
        </div>
      )}
    </form>
  );
}
