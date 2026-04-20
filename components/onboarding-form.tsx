"use client";

import { useState, useTransition } from "react";
import { updateUserOnboardingAction } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

export function OnboardingForm({ lang }: { lang: string }) {
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const isAr = lang === "ar";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.set("role", role);
    formData.set("phone", phone);

    startTransition(async () => {
      const result = await updateUserOnboardingAction(formData);
      if (result.success) {
        router.push(result.redirectPath || "/dashboard");
      } else {
        setError(result.error || "Failed to update profile");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight">
          {isAr ? "أهلاً بك في Smart Attendance" : "Welcome to Smart Attendance"}
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {isAr ? "لنكمل إعداد ملفك الشخصي" : "Let's finish setting up your profile"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-bold uppercase tracking-widest text-[var(--color-muted)]">
            {isAr ? "من أنت؟" : "What is your role?"}
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "student", labelAr: "طالب", labelEn: "Student", icon: "🎓" },
              { id: "teacher", labelAr: "معلم", labelEn: "Teacher", icon: "👨‍🏫" },
              { id: "parent", labelAr: "ولي أمر", labelEn: "Parent", icon: "🏠" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 ${
                  role === item.id 
                    ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] shadow-lg" 
                    : "border-[var(--color-line)] bg-[var(--surface-2)] hover:border-[var(--color-muted)]"
                }`}
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="font-bold text-[var(--color-ink)]">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {role === "parent" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="block text-sm font-bold uppercase tracking-widest text-[var(--color-muted)]">
              {isAr ? "رقم الهاتف (ضروري لأولياء الأمور)" : "Phone Number (Required for Parents)"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="e.g. 0501234567"
              className="field-input text-lg py-4"
            />
            <p className="text-xs text-[var(--color-muted)]">
              {isAr 
                ? "سنستخدم هذا الرقم لرسائل الغياب الهامة." 
                : "We'll use this for important absence notifications."}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn btn--primary w-full py-4 text-lg font-bold shadow-xl flex items-center justify-center gap-2"
        >
          {isPending ? (
            <span className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
          ) : (
            isAr ? "بدء الاستخدام" : "Get Started"
          )}
        </button>
      </form>
    </div>
  );
}
