"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type AppLanguage as I18nLang } from "@/lib/i18n";
import { saveSettingsBatchAction } from "@/app/actions/settings";
import themeSwitchStyles from "./settings-theme-switch.module.css";

function minutesToTimeStr(minutes: string) {
  const m = parseInt(minutes, 10);
  if (!Number.isFinite(m) || m < 0 || m > 1439) {
    return "00:00";
  }
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeStrToMinutes(timeStr: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return (h * 60) + m;
}

type ThemePreference = "light" | "dark";
type AppLanguage = "en" | "ar";
type BackupInterval = "off" | "daily" | "weekly";
type SaveMessageType = "success" | "error";
type SettingUpdate = { key: string; value: string };

function normalizeThemePreference(value: string): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

function normalizeLanguage(value: string): AppLanguage {
  return value === "ar" ? "ar" : "en";
}

function normalizeBackupInterval(value: string): BackupInterval {
  if (value === "daily" || value === "weekly") {
    return value;
  }
  return "off";
}

function parseBooleanSetting(value: string, fallback = true) {
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function applyThemePreference(themePreference: ThemePreference) {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(themePreference === "dark" ? "dark" : "light");
}

function applyLanguagePreference(language: AppLanguage) {
  const html = document.documentElement;
  html.setAttribute("lang", language);
  html.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
  document.cookie = `app_language=${language}; path=/; max-age=31536000; samesite=lax`;
}

export function SettingsForm({
  initialLateCutoff,
  initialCheckInOpen,
  initialCheckInClose,
  initialThemePreference,
  initialLanguage,
  initialUnknownFaceAlerts,
  initialPhoneDetectionAlerts,
  initialBackupInterval,
}: {
  initialLateCutoff: string;
  initialCheckInOpen: string;
  initialCheckInClose: string;
  initialThemePreference: string;
  initialLanguage: string;
  initialUnknownFaceAlerts: string;
  initialPhoneDetectionAlerts: string;
  initialBackupInterval: string;
}) {
  const router = useRouter();
  const [timeLate, setTimeLate] = useState(minutesToTimeStr(initialLateCutoff));
  const [timeOpen, setTimeOpen] = useState(minutesToTimeStr(initialCheckInOpen));
  const [timeClose, setTimeClose] = useState(minutesToTimeStr(initialCheckInClose));
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    normalizeThemePreference(initialThemePreference),
  );
  const [language, setLanguage] = useState<AppLanguage>(
    normalizeLanguage(initialLanguage),
  );
  const [unknownFaceAlertsEnabled, setUnknownFaceAlertsEnabled] = useState(
    parseBooleanSetting(initialUnknownFaceAlerts, true),
  );
  const [phoneDetectionAlertsEnabled, setPhoneDetectionAlertsEnabled] = useState(
    parseBooleanSetting(initialPhoneDetectionAlerts, true),
  );
  const [backupInterval, setBackupInterval] = useState<BackupInterval>(
    normalizeBackupInterval(initialBackupInterval),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<SaveMessageType | null>(null);

  const didHydrateRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef("");
  const lastSavedLanguageRef = useRef<AppLanguage>(normalizeLanguage(initialLanguage));

  const uiLang: I18nLang = language;

  useEffect(() => {
    applyThemePreference(themePreference);
  }, [themePreference]);

  useEffect(() => {
    applyLanguagePreference(language);
  }, [language]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  async function saveUpdates(updates: SettingUpdate[]) {
    try {
      const response = await fetch("/api/settings/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const result = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `HTTP ${response.status}`);
      }

      return true;
    } catch {
      const fallback = await saveSettingsBatchAction(updates);
      return Boolean(fallback?.success);
    }
  }

  useEffect(() => {
    const openMinutes = timeStrToMinutes(timeOpen);
    const lateMinutes = timeStrToMinutes(timeLate);
    const closeMinutes = timeStrToMinutes(timeClose);

    const updates: SettingUpdate[] | null =
      openMinutes === null || lateMinutes === null || closeMinutes === null
        ? null
        : [
            { key: "late_cutoff_minutes", value: String(lateMinutes) },
            { key: "check_in_open_minutes", value: String(openMinutes) },
            { key: "check_in_close_minutes", value: String(closeMinutes) },
            { key: "theme_preference", value: themePreference },
            { key: "app_language", value: language },
            { key: "alerts_unknown_face_enabled", value: unknownFaceAlertsEnabled ? "true" : "false" },
            { key: "alerts_phone_detection_enabled", value: phoneDetectionAlertsEnabled ? "true" : "false" },
            { key: "backup_interval", value: backupInterval },
          ];

    if (!updates) {
      if (didHydrateRef.current) {
        setIsSaving(false);
        setMessageType("error");
        setMessage(t("settings.invalidTime", uiLang));
      }
      return;
    }

    const snapshot = JSON.stringify(updates);

    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
      lastSavedSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setIsSaving(true);
    setMessageType(null);
    setMessage(t("settings.savingLive", uiLang));

    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        const success = await saveUpdates(updates);
        if (success) {
          lastSavedSnapshotRef.current = snapshot;
          setIsSaving(false);
          setMessageType("success");
          setMessage(t("settings.savedLive", uiLang));

          if (language !== lastSavedLanguageRef.current) {
            lastSavedLanguageRef.current = language;
            router.refresh();
          }
        } else {
          setIsSaving(false);
          setMessageType("error");
          setMessage(t("settings.savedError", uiLang));
        }
      })();
    }, 450);
  }, [
    timeOpen,
    timeLate,
    timeClose,
    themePreference,
    language,
    unknownFaceAlertsEnabled,
    phoneDetectionAlertsEnabled,
    backupInterval,
    uiLang,
    router,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-line)] pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {t("settings.autoSaveOn", uiLang)}
        </p>
        {message ? (
          <span className={`form-message ${messageType === "error" ? "form-message--error" : "form-message--success"} px-3 py-1.5`}>
            {isSaving ? t("settings.savingLive", uiLang) : message}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="form-section space-y-3">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{t("settings.attendanceWindow", uiLang)}</p>
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
                {t("settings.checkInOpen", uiLang)}
              </label>
              <input
                type="time"
                value={timeOpen}
                onChange={(e) => setTimeOpen(e.target.value)}
                className="field-input h-11 min-w-[170px] text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
                {t("settings.lateCutoff", uiLang)}
              </label>
              <input
                type="time"
                value={timeLate}
                onChange={(e) => setTimeLate(e.target.value)}
                className="field-input h-11 min-w-[170px] text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
                {t("settings.checkInClose", uiLang)}
              </label>
              <input
                type="time"
                value={timeClose}
                onChange={(e) => setTimeClose(e.target.value)}
                className="field-input h-11 min-w-[170px] text-sm"
              />
            </div>
          </div>
        </section>

        <section className="form-section space-y-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {t("settings.themeMode", uiLang)}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--surface-1)] p-3 shadow-[var(--shadow-sm)]">
            <label className={themeSwitchStyles.themeSwitch} aria-label={t("settings.themeMode", uiLang)}>
              <input
                type="checkbox"
                className={themeSwitchStyles.themeSwitchCheckbox}
                checked={themePreference === "dark"}
                onChange={(event) => setThemePreference(event.target.checked ? "dark" : "light")}
                role="switch"
                aria-checked={themePreference === "dark"}
              />
              <div className={themeSwitchStyles.themeSwitchContainer}>
                <div className={themeSwitchStyles.themeSwitchStarsContainer}>
                  <svg viewBox="0 0 144 55" fill="none" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.194 4.68303 133.348 5.5158C133.8 5.47409 134.252 5.42195 134.715 5.3698C135.709 5.26551 136.691 5.16122 137.672 5.16122C138.349 5.16122 138.619 5.67217 138.349 6.12008C137.443 7.6183 136.537 9.11652 135.64 10.6252C136.537 10.5522 137.443 10.4792 138.349 10.4792C138.868 10.4792 139.232 11.0214 138.972 11.4798C138.005 13.1865 137.029 14.8931 136.052 16.5998C137.029 16.5279 138.005 16.4561 138.972 16.4561C139.491 16.4561 139.865 17.0092 139.595 17.4677C138.651 19.1743 137.693 20.881 136.739 22.5876C138.516 22.4425 140.283 22.2974 142.06 22.2974C142.58 22.2974 142.944 22.8397 142.684 23.2981C138.349 30.8851 133.925 38.399 129.501 45.9233C129.005 46.7602 128.047 47.1228 127.088 46.9881C126.13 47.1228 125.172 46.7602 124.675 45.9233C120.251 38.399 115.828 30.8851 111.492 23.2981C111.232 22.8397 111.596 22.2974 112.116 22.2974C113.893 22.2974 115.67 22.4425 117.447 22.5876C116.489 20.881 115.531 19.1743 114.583 17.4677C114.323 17.0092 114.687 16.4561 115.207 16.4561C116.183 16.4561 117.149 16.5279 118.126 16.5998C117.149 14.8931 116.173 13.1865 115.207 11.4798C114.947 11.0214 115.311 10.4792 115.83 10.4792C116.736 10.4792 117.632 10.5522 118.538 10.6252C117.632 9.11652 116.726 7.6183 115.83 6.12008C115.56 5.67217 115.83 5.16122 116.507 5.16122C117.477 5.16122 118.459 5.26551 119.453 5.3698C119.915 5.42195 120.367 5.47409 120.819 5.5158C119.974 4.68303 119.123 3.85027 118.336 3.00688C117.894 2.54845 118.178 1.75739 118.795 1.75739C119.748 1.75739 120.701 1.87014 121.654 1.98289C122.01 2.0236 122.355 2.0643 122.701 2.09572C122.355 1.679 122.009 1.26229 121.673 0.845575C121.3 0.387145 121.56 0 122.149 0H131.748C132.337 0 132.597 0.387145 132.224 0.845575C131.888 1.26229 131.543 1.679 131.197 2.09572C131.543 2.0643 131.888 2.0236 132.244 1.98289C133.197 1.87014 134.15 1.75739 135.103 1.75739C135.719 1.75739 136.004 2.54845 135.562 3.00688H135.831Z" fill="currentColor" />
                  </svg>
                </div>
                <div className={themeSwitchStyles.themeSwitchClouds} />
                <div className={themeSwitchStyles.themeSwitchCircleContainer}>
                  <div className={themeSwitchStyles.themeSwitchSunMoonContainer}>
                    <div className={themeSwitchStyles.themeSwitchMoon}>
                      <div className={themeSwitchStyles.themeSwitchSpot} />
                      <div className={themeSwitchStyles.themeSwitchSpot} />
                      <div className={themeSwitchStyles.themeSwitchSpot} />
                    </div>
                  </div>
                </div>
              </div>
            </label>

            <div className="mt-3 grid grid-cols-2 items-center text-sm font-semibold" dir="ltr">
              <span className={themePreference === "dark" ? "text-[var(--color-muted)]" : "text-[var(--color-ink)]"}>
                {t("settings.themeLight", uiLang)}
              </span>
              <span className={`text-right ${themePreference === "dark" ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`}>
                {t("settings.themeDark", uiLang)}
              </span>
            </div>
          </div>
        </section>

        <section className="form-section space-y-3">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{t("settings.language", uiLang)}</p>
          <select
            value={language}
            onChange={(e) => {
              const nextLanguage = normalizeLanguage(e.target.value);
              setLanguage(nextLanguage);
            }}
            className="field-input"
          >
            <option value="en">{t("settings.languageEnglish", uiLang)}</option>
            <option value="ar">{t("settings.languageArabic", uiLang)}</option>
          </select>

          <div className="pt-2">
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
              {t("settings.backupInterval", uiLang)}
            </label>
            <select
              value={backupInterval}
              onChange={(event) => setBackupInterval(normalizeBackupInterval(event.target.value))}
              className="field-input"
            >
              <option value="off">{t("settings.backupOff", uiLang)}</option>
              <option value="daily">{t("settings.backupDaily", uiLang)}</option>
              <option value="weekly">{t("settings.backupWeekly", uiLang)}</option>
            </select>
          </div>
        </section>

        <section className="form-section space-y-3">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{t("settings.alertControls", uiLang)}</p>
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <input
              type="checkbox"
              checked={unknownFaceAlertsEnabled}
              onChange={(event) => setUnknownFaceAlertsEnabled(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {t("settings.unknownFaceAlerts", uiLang)}
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <input
              type="checkbox"
              checked={phoneDetectionAlertsEnabled}
              onChange={(event) => setPhoneDetectionAlertsEnabled(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            {t("settings.phoneDetectionAlerts", uiLang)}
          </label>
        </section>
      </div>
    </div>
  );
}
