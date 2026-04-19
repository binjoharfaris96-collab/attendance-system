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

export function LoginForm({ defaultEmail }: LoginFormProps) {
  const [state, action] = useActionState(login, idleActionState);
  const [activeLang, setActiveLang] = useState<AppLanguage>("en");

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
      <form action={action} className="space-y-4">
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
