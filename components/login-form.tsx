"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { t, type AppLanguage } from "@/lib/i18n";
import { idleActionState } from "@/lib/types";

type LoginFormProps = {
  defaultEmail: string;
};

const ROLES = [
  { id: "admin", label: "Admin", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>` },
  { id: "teacher", label: "Teacher", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>` },
  { id: "student", label: "Student", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>` },
];

export function LoginForm({ defaultEmail }: LoginFormProps) {
  const [state, action] = useActionState(login, idleActionState);
  const [activeLang, setActiveLang] = useState<AppLanguage>("en");
  const [selectedRole, setSelectedRole] = useState("admin");

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
        <label className="field-label" htmlFor="email">
          {t("login.username", activeLang)}
        </label>
        <input
          id="email"
          name="email"
          type="text"
          defaultValue={defaultEmail}
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
        />
      </div>

      <SubmitButton
        label={activeLang === "ar" ? "تسجيل الدخول" : "Login"}
        pendingLabel={activeLang === "ar" ? "جاري تسجيل الدخول..." : "Logging in..."}
        className="btn btn--primary w-full justify-center"
      />

      <Link
        href="/signup"
        className="btn btn--outline w-full justify-center"
      >
        {activeLang === "ar" ? "إنشاء حساب" : "Sign Up"}
      </Link>

      {state.message ? (
        <p
          className={`form-message form-message--${state.status}`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-2 text-center text-sm">
        <span className="text-[var(--color-muted)]">
          {activeLang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}
        </span>{" "}
        <Link
          href="/signup"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          {activeLang === "ar" ? "إنشاء حساب" : "Create an account"}
        </Link>
      </div>
      </form>
    </div>
  );
}
