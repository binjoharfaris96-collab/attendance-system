import { getSetting } from "@/lib/db";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { AppsHubClient } from "./apps-hub-client";
import styles from "./styles.module.css";

type ExternalApp = {
  id: string;
  href: string;
  title: string;
  subtitleKey: string;
  logoSrc: string;
  logoAlt: string;
  logoClassName?: string;
};

type SavedCustomApp = {
  id: string;
  title: string;
  href: string;
};

const externalApps: ExternalApp[] = [
  {
    id: "gmail",
    href: "https://mail.google.com/",
    title: "Gmail",
    subtitleKey: "apps.gmailDesc",
    logoSrc: "/app-logos/gmail.png",
    logoAlt: "Gmail logo",
  },
  {
    id: "whatsapp",
    href: "https://web.whatsapp.com/",
    title: "WhatsApp",
    subtitleKey: "apps.whatsappDesc",
    logoSrc: "/app-logos/whatsapp.png",
    logoAlt: "WhatsApp logo",
    logoClassName: styles.whatsappLogo,
  },
  {
    id: "classroom",
    href: "https://classroom.google.com/",
    title: "Google Classroom",
    subtitleKey: "apps.classroomDesc",
    logoSrc: "/app-logos/google-classroom.png",
    logoAlt: "Google Classroom logo",
  },
  {
    id: "managebac",
    href: "https://www.managebac.com/",
    title: "ManageBac",
    subtitleKey: "apps.managebacDesc",
    logoSrc: "/app-logos/managebac.webp",
    logoAlt: "ManageBac logo",
  },
  {
    id: "youtube",
    href: "https://www.youtube.com/",
    title: "YouTube",
    subtitleKey: "apps.youtubeDesc",
    logoSrc: "/app-logos/youtube.png",
    logoAlt: "YouTube logo",
  },
  {
    id: "kahoot",
    href: "https://kahoot.it/",
    title: "Kahoot",
    subtitleKey: "apps.kahootDesc",
    logoSrc: "/app-logos/kahoot.png",
    logoAlt: "Kahoot logo",
  },
  {
    id: "meet",
    href: "https://meet.google.com/",
    title: "Google Meet",
    subtitleKey: "apps.meetDesc",
    logoSrc: "/app-logos/google-meet.png",
    logoAlt: "Google Meet logo",
  },
  {
    id: "docs",
    href: "https://docs.google.com/",
    title: "Google Docs",
    subtitleKey: "apps.docsDesc",
    logoSrc: "/app-logos/google-docs.png",
    logoAlt: "Google Docs logo",
  },
  {
    id: "slides",
    href: "https://slides.google.com/",
    title: "Google Slides",
    subtitleKey: "apps.slidesDesc",
    logoSrc: "/app-logos/google-slides.png",
    logoAlt: "Google Slides logo",
  },
];

function parseCustomApps(raw: string): SavedCustomApp[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
      .map((entry) => ({
        id: typeof entry.id === "string" && entry.id ? entry.id : `${Date.now()}-${Math.random()}`,
        title: typeof entry.title === "string" ? entry.title.trim() : "",
        href: typeof entry.href === "string" ? entry.href.trim() : "",
      }))
      .filter((entry) => entry.title && entry.href)
      .slice(0, 40);
  } catch {
    return [];
  }
}

export default async function AppsPage() {
  const lang = await getAppLanguage();
  const t = createTranslator(lang);
  const initialCustomApps = parseCustomApps(getSetting("custom_apps", "[]"));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("apps.title")}</h1>
          <p className="page-subtitle">{t("apps.subtitle")}</p>
        </div>
      </div>

      <AppsHubClient
        lang={lang}
        builtInApps={externalApps}
        initialCustomApps={initialCustomApps}
      />
    </div>
  );
}
