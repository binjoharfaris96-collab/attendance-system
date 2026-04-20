"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { register } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { t, type AppLanguage } from "@/lib/i18n";
import { idleActionState } from "@/lib/types";

const ROLES = [
  { id: "teacher", label: "Teacher", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>` },
  { id: "student", label: "Student", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>` },
  { id: "parent", label: "Parent", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
];

export function RegisterForm() {
  const [state, action] = useActionState(register, idleActionState);
  const [activeLang, setActiveLang] = useState<AppLanguage>("en");
  const [selectedRole, setSelectedRole] = useState("teacher");

  useEffect(() => {
    const updateLangFromHtml = () => {
      const htmlLang = document.documentElement.lang === "ar" ? "ar" : "en";
      setActiveLang(htmlLang);
    };

    updateLangFromHtml();

    const observer = new MutationObserver(updateLangFromHtml);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <div className="flex p-1 bg-[var(--surface-2)] border border-[var(--color-line)] rounded-2xl">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRole(role.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedRole === role.id 
                ? "bg-[var(--surface-1)] text-[var(--color-accent)] shadow-sm border border-[var(--color-line)]" 
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            <div dangerouslySetInnerHTML={{ __html: role.icon }} className={selectedRole === role.id ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"} />
            {role.label}
          </button>
        ))}
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="role" value={selectedRole} />


      <div className="space-y-1.5">
        <label className="field-label" htmlFor="fullName">
          {activeLang === "ar" ? "الاسم الكامل" : "Full Name"}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          className="field-input"
          placeholder={activeLang === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="field-label" htmlFor="email">
          {t("login.username", activeLang)}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="field-input"
          placeholder={t("login.username", activeLang)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="field-label" htmlFor="password">
          {t("login.password", activeLang)}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field-input"
          placeholder={t("login.password", activeLang)}
          required
          minLength={8}
        />
      </div>

      {selectedRole === "parent" && (
        <div className="space-y-1.5">
          <label className="field-label" htmlFor="phone">
            {activeLang === "ar" ? "رقم الهاتف" : "Phone Number"}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="field-input"
            placeholder={activeLang === "ar" ? "أدخل رقم الهاتف" : "Enter your phone number"}
            required
          />
        </div>
      )}

      <SubmitButton
        label={activeLang === "ar" ? "إنشاء حساب" : "Sign Up"}
        pendingLabel={activeLang === "ar" ? "جاري الإنشاء..." : "Creating account..."}
        className="btn btn--primary w-full justify-center"
      />

      {state.message ? (
        <p
          className={`form-message form-message--${state.status}`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-6 text-center text-sm">
        <span className="text-[var(--color-muted)]">
          {activeLang === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}
        </span>{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          {t("login.signIn", activeLang)}
        </Link>
      </div>
    </form>
    </div>
  );
}
