import { formatDateTime } from "@/lib/time";
import { listUnknownFaces, clearUnknownFaces } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export default async function WarningsPage() {
  const faces = await listUnknownFaces(50);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  async function clearLogsAction() {
    "use server";
    clearUnknownFaces();
    revalidatePath("/", "layout");
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("warnings.title")}</h1>
          <p className="page-subtitle">{t("warnings.subtitle")}</p>
        </div>
        {faces.length > 0 && (
          <form action={clearLogsAction}>
            <button className="btn btn--danger">
              {t("warnings.clearAll")}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        {faces.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {faces.map((f) => (
              <div key={f.id} className="list-row group flex flex-col overflow-hidden">
                <div className="relative bg-[color-mix(in_srgb,var(--surface-2)_72%,transparent)]">
                  <img
                    src={f.imageData}
                    alt={t("warnings.unknown")}
                    className="block aspect-square w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center justify-center rounded bg-red-600/90 px-2 py-1 shadow backdrop-blur-md">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("warnings.unknown")}</span>
                  </div>
                </div>
                <div className="flex flex-col p-3 border-t border-[var(--color-line)]">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-muted)]">{t("warnings.detectedAt")}</span>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--color-ink)] truncate">
                    {formatDateTime(f.detectedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-line)]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-ink)]">{t("warnings.allClear")}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t("warnings.noUnrecognized")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
