import { formatDateTime } from "@/lib/time";
import { listPhoneDetections, clearPhoneDetections } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export default async function DeviceLogsPage() {
  const detections = listPhoneDetections(50);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  async function clearLogsAction() {
    "use server";
    clearPhoneDetections();
    revalidatePath("/", "layout");
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("deviceLogs.title")}</h1>
          <p className="page-subtitle">{t("deviceLogs.subtitle")}</p>
        </div>
        {detections.length > 0 && (
          <form action={clearLogsAction}>
            <button className="btn btn--danger">
              {t("deviceLogs.clearAll")}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        {detections.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {detections.map((f) => (
              <div key={f.id} className="list-row group flex flex-col overflow-hidden">
                <div className="relative border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-0)_86%,black)]" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={f.imageData}
                    alt={t("deviceLogs.deviceDetected")}
                    className="block absolute inset-0 w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex items-center justify-center rounded bg-red-600/90 px-2 py-1 shadow backdrop-blur-md">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("deviceLogs.deviceDetected")}</span>
                  </div>
                </div>
                <div className="flex flex-col p-3">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-muted)]">{t("deviceLogs.detectedAt")}</span>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--color-ink)] truncate">
                    {formatDateTime(f.detectedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-line)]"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-ink)]">{t("deviceLogs.allClear")}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t("deviceLogs.noDevices")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
