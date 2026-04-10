"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { register } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { t, type AppLanguage } from "@/lib/i18n";
import { idleActionState } from "@/lib/types";

export function RegisterForm() {
  const [state, action] = useActionState(register, idleActionState);
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
    <form action={action} className="space-y-4">
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
  );
}
