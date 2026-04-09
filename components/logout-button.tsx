import { logout } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { t, type AppLanguage } from "@/lib/i18n";

export function LogoutButton({ lang = "en" }: { lang?: AppLanguage }) {
  return (
    <form action={logout}>
      <SubmitButton
        label={t("nav.logout", lang)}
        pendingLabel={t("nav.logout", lang) + "..."}
        className="pill-nav-item w-full justify-start"
      />
    </form>
  );
}
