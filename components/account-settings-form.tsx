"use client";

import { useEffect, useState, useTransition } from "react";
import { updateAccountCredentialsAction } from "@/app/actions/settings";
import { t, type AppLanguage } from "@/lib/i18n";

export function AccountSettingsForm({
  initialUsername,
  initialPhone = "",
  lang = "en",
}: {
  initialUsername: string;
  initialPhone?: string;
  lang?: AppLanguage;
}) {
  const [activeLang, setActiveLang] = useState<AppLanguage>(lang);
  const [username, setUsername] = useState(initialUsername);
  const [phone, setPhone] = useState(initialPhone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.set("username", username);
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);
    formData.set("phone", phone);

    startTransition(async () => {
      const result = await updateAccountCredentialsAction(formData);

      if (result.success) {
        setIsSuccess(true);
        setMessage(result.message || t("account.updateSuccess", activeLang));
        if (result.username) {
          setUsername(result.username);
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setIsSuccess(false);
        setMessage(result.error || t("account.updateError", activeLang));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("account.username", activeLang)}
        </label>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="field-input"
          placeholder={t("account.usernamePlaceholder", activeLang)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {activeLang === "ar" ? "رقم الهاتف" : "Phone Number"}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="field-input"
          placeholder={activeLang === "ar" ? "مثال: 0501234567" : "e.g. 0501234567"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("account.currentPassword", activeLang)}
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="field-input"
          placeholder={t("account.currentPassword", activeLang)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("account.newPassword", activeLang)}
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="field-input"
          placeholder={t("account.newPassword", activeLang)}
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {t("account.minPassword", activeLang)}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          {t("account.confirmPassword", activeLang)}
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="field-input"
          placeholder={t("account.confirmPassword", activeLang)}
        />
      </div>

      <div className="pt-2 border-t border-[var(--color-line)]">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn--primary"
        >
          {isPending ? t("account.updating", activeLang) : t("account.updateAccount", activeLang)}
        </button>
      </div>

      {message ? (
        <p className={`form-message ${isSuccess ? "form-message--success" : "form-message--error"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
