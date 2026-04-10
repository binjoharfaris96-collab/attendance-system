"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { t, type AppLanguage } from "@/lib/i18n";

type NavLinkProps = {
  href: string;
  labelKey: string;
  icon: string;
  badge?: number;
  lang?: AppLanguage;
};

export function NavLink({ href, labelKey, icon, badge, lang = "en" }: NavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const [activeLang, setActiveLang] = useState<AppLanguage>(lang);

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
  }, [lang]);

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={() => router.refresh()}
      className={`pill-nav-item ${isActive ? "pill-nav-item--active" : ""}`}
      dir={activeLang === "ar" ? "rtl" : "ltr"}
    >
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center transition-opacity ${
          isActive ? "opacity-100" : "opacity-80"
        }`}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      <span className="min-w-0 flex-1 truncate">{t(labelKey, activeLang)}</span>
      {badge !== undefined && badge > 0 ? (
        <span className="ms-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500/95 px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
