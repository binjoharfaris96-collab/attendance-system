"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { createTranslator, type AppLanguage } from "@/lib/i18n";

import styles from "./styles.module.css";

type BuiltInApp = {
  id: string;
  href: string;
  title: string;
  subtitleKey: string;
  logoSrc: string;
  logoAlt: string;
  logoClassName?: string;
};

type CustomApp = {
  id: string;
  title: string;
  href: string;
};

function normalizeUrl(value: string) {
  const raw = value.trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.href;
  } catch {
    return null;
  }
}

function getCustomInitials(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return "A";
  return cleaned.slice(0, 2).toUpperCase();
}

function createCustomAppId(title: string, href: string, existing: CustomApp[]) {
  const base = `${title}-${href}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "custom-app";

  let nextId = base;
  let index = 2;
  while (existing.some((entry) => entry.id === nextId)) {
    nextId = `${base}-${index}`;
    index += 1;
  }
  return nextId;
}

export function AppsHubClient({
  lang,
  initialCustomApps,
  builtInApps,
}: {
  lang: AppLanguage;
  initialCustomApps: CustomApp[];
  builtInApps: BuiltInApp[];
}) {
  const t = createTranslator(lang);
  const [customApps, setCustomApps] = useState<CustomApp[]>(initialCustomApps);
  const [appName, setAppName] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const allApps = useMemo(
    () => [
      ...builtInApps,
      ...customApps.map((app) => ({
        ...app,
        subtitleKey: "apps.customDesc",
        logoSrc: "",
        logoAlt: "",
      })),
    ],
    [builtInApps, customApps],
  );

  async function persist(nextCustomApps: CustomApp[]) {
    const response = await fetch("/api/settings/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updates: [{ key: "custom_apps", value: JSON.stringify(nextCustomApps) }],
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { success?: boolean }
      | null;

    return response.ok && Boolean(result?.success);
  }

  async function handleAddApp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = appName.trim();
    const href = normalizeUrl(appUrl);

    if (!title || !href) {
      setMessageType("error");
      setMessage(t("apps.invalidInput"));
      return;
    }

    const newApp: CustomApp = {
      id: createCustomAppId(title, href, customApps),
      title,
      href,
    };

    const nextCustomApps = [newApp, ...customApps].slice(0, 40);

    setIsSaving(true);
    setMessage("");
    setMessageType(null);

    const ok = await persist(nextCustomApps);
    setIsSaving(false);

    if (!ok) {
      setMessageType("error");
      setMessage(t("apps.addFailed"));
      return;
    }

    setCustomApps(nextCustomApps);
    setAppName("");
    setAppUrl("");
    setMessageType("success");
    setMessage(t("apps.addSuccess"));
  }

  return (
    <section className={styles.wrap}>
      <article className={styles.bigCard}>
        <div className={styles.bgGlow} />

        <div className={styles.headerRow}>
          <div>
            <p className={styles.eyebrow}>{t("apps.workspace")}</p>
            <h2 className={styles.headline}>{t("apps.schoolSuite")}</h2>
            <p className={styles.copy}>{t("apps.tip")}</p>
          </div>
        </div>

        <form onSubmit={handleAddApp} className={styles.addAppForm}>
          <div className={styles.addAppGrid}>
            <input
              type="text"
              value={appName}
              onChange={(event) => setAppName(event.target.value)}
              placeholder={t("apps.appNamePlaceholder")}
              className="field-input"
              maxLength={50}
            />
            <input
              type="text"
              value={appUrl}
              onChange={(event) => setAppUrl(event.target.value)}
              placeholder={t("apps.appUrlPlaceholder")}
              className="field-input"
              dir="ltr"
            />
            <button type="submit" className="btn btn--outline" disabled={isSaving}>
              {isSaving ? t("apps.adding") : t("apps.addApp")}
            </button>
          </div>
          {message ? (
            <p className={messageType === "error" ? styles.addError : styles.addSuccess}>
              {message}
            </p>
          ) : null}
        </form>

        <div className={styles.appGrid}>
          {allApps.map((app) => (
            <a
              key={app.id}
              href={app.href}
              target="_blank"
              rel="noreferrer noopener"
              className={styles.appTile}
            >
              {app.logoSrc ? (
                <span className={styles.logoWrap}>
                  <Image
                    src={app.logoSrc}
                    alt={app.logoAlt}
                    width={112}
                    height={112}
                    sizes="112px"
                    quality={100}
                    className={`${styles.logoImg}${app.logoClassName ? ` ${app.logoClassName}` : ""}`}
                  />
                </span>
              ) : (
                <span className={styles.logoWrap}>
                  <span className={styles.customLogo}>{getCustomInitials(app.title)}</span>
                </span>
              )}
              <span className={styles.tileText}>
                <span className={styles.appName}>{app.title}</span>
                <span className={styles.appDesc}>{t(app.subtitleKey)}</span>
              </span>
              <span className={styles.launch}>{t("apps.openApp")}</span>
            </a>
          ))}
        </div>
      </article>
    </section>
  );
}
