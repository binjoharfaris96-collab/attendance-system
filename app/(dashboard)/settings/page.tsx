import { getSetting } from "@/lib/db";
import { SettingsForm } from "@/components/settings-form";
import { BackupRestorePanel } from "@/components/backup-restore-panel";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { getAuthDefaults } from "@/lib/auth";
import { createTranslator, type AppLanguage } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";
import { requireSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await requireSession();
  if (session.role === "student") {
    return (
      <div className="p-8 text-center text-red-600 font-bold border rounded-lg bg-red-50 mt-10 max-w-2xl mx-auto">
        Access Denied. Global Configuration parameters require level 4 administrative clearance.
      </div>
    );
  }
  const lateCutoffMinutes = await getSetting("late_cutoff_minutes", "470");
  const checkInOpenMinutes = await getSetting("check_in_open_minutes", "0");
  const checkInCloseMinutes = await getSetting("check_in_close_minutes", "1439");
  const themePreference = await getSetting("theme_preference", "dark");
  const appLanguage = await getAppLanguage();
  const unknownFaceAlerts = await getSetting("alerts_unknown_face_enabled", "true");
  const phoneDetectionAlerts = await getSetting("alerts_phone_detection_enabled", "true");
  const backupInterval = await getSetting("backup_interval", "weekly");
  const authDefaults = await getAuthDefaults();
  const t = createTranslator(appLanguage as AppLanguage);

  return (
    <div className="space-y-7">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("settings.title")}</h1>
          <p className="page-subtitle">{t("settings.subtitle")}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="card">
          <SettingsForm 
            initialLateCutoff={lateCutoffMinutes}
            initialCheckInOpen={checkInOpenMinutes}
            initialCheckInClose={checkInCloseMinutes}
            initialThemePreference={themePreference}
            initialLanguage={appLanguage}
            initialUnknownFaceAlerts={unknownFaceAlerts}
            initialPhoneDetectionAlerts={phoneDetectionAlerts}
            initialBackupInterval={backupInterval}
            isAdmin={session.role === "admin"}
          />
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                {t("settings.accountSecurity")}
              </h3>
              <p className="text-sm text-[var(--color-muted)]">
                {t("settings.accountSecurityDesc")}
              </p>
            </div>
            <AccountSettingsForm 
              initialUsername={session.email} 
              initialPhone={session.phone}
              lang={appLanguage as AppLanguage} 
            />
          </div>

          {session.role === "admin" && (
            <div className="card">
              <BackupRestorePanel lang={appLanguage as AppLanguage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
