"use client";

import { useActionState, useEffect, useState } from "react";

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
        label={t("login.signIn", activeLang)}
        pendingLabel={t("login.signingIn", activeLang)}
        className="btn btn--primary w-full justify-center"
      />

      {state.message ? (
        <p
          className={`form-message form-message--${state.status}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
