"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { t, type AppLanguage } from "@/lib/i18n";

type BackupStatus = {
  kind: "success" | "error";
  text: string;
} | null;

function extractFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

export function BackupRestorePanel({ lang = "en" }: { lang?: AppLanguage }) {
  const router = useRouter();
  const [activeLang, setActiveLang] = useState<AppLanguage>(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<BackupStatus>(null);
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isRestoring, startRestoreTransition] = useTransition();

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

  function clearStatusLater() {
    setTimeout(() => setStatus(null), 4000);
  }

  function handleDownloadBackup() {
    setStatus(null);

    startDownloadTransition(async () => {
      try {
        const response = await fetch("/api/backup", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(t("backup.downloadError", activeLang));
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        const suggestedName =
          extractFileName(contentDisposition) || "attendance-backup.json";

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = suggestedName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);

        setStatus({
          kind: "success",
          text: t("backup.downloadSuccess", activeLang),
        });
        clearStatusLater();
      } catch (error) {
        setStatus({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : t("backup.downloadError", activeLang),
        });
      }
    });
  }

  function handleRestoreBackup(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatus({
        kind: "error",
        text: t("backup.selectFile", activeLang),
      });
      return;
    }

    const confirmed = window.confirm(t("backup.confirmRestore", activeLang));
    if (!confirmed) {
      return;
    }

    startRestoreTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("backupFile", file);

        const response = await fetch("/api/backup", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; message?: string; error?: string }
          | null;

        if (!response.ok || !payload?.success) {
          throw new Error(t("backup.restoreError", activeLang));
        }

        setStatus({
          kind: "success",
          text: t("backup.restoreSuccess", activeLang),
        });
        fileInputRef.current!.value = "";
        router.refresh();
        clearStatusLater();
      } catch (error) {
        setStatus({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : t("backup.restoreError", activeLang),
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
          {t("backup.title", activeLang)}
        </h3>
        <p className="text-sm text-[var(--color-muted)]">
          {t("backup.subtitle", activeLang)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownloadBackup}
          disabled={isDownloading || isRestoring}
          className="btn btn--outline"
        >
          {isDownloading ? t("backup.preparing", activeLang) : t("backup.download", activeLang)}
        </button>
      </div>

      <form onSubmit={handleRestoreBackup} className="space-y-3 border-t border-[var(--color-line)] pt-4">
        <label className="field-label" htmlFor="backupFile">
          {t("backup.restoreLabel", activeLang)}
        </label>
        <input
          id="backupFile"
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="field-input"
          disabled={isDownloading || isRestoring}
        />
        <button
          type="submit"
          disabled={isDownloading || isRestoring}
          className="btn btn--primary"
        >
          {isRestoring ? t("backup.restoring", activeLang) : t("backup.restoreButton", activeLang)}
        </button>
      </form>

      {status ? (
        <p
          className={`form-message ${
            status.kind === "success" ? "form-message--success" : "form-message--error"
          }`}
        >
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
