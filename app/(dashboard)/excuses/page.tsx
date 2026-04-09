import { listStudents, listExcuses } from "@/lib/db";
import { ExcuseForm } from "@/components/excuse-form";
import { formatDateTime } from "@/lib/time";
import { deleteExcuseAction } from "@/app/actions/excuse";
import { revalidatePath } from "next/cache";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export default async function ExcusesPage() {
  const students = listStudents();
  const excuses = listExcuses(50);
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  // We need an inline server action for deletion in this context
  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteExcuseAction(id);
      revalidatePath("/excuses");
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("excuses.title")}</h1>
          <p className="page-subtitle">{t("excuses.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="card h-fit">
          <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">{t("excuses.grantExcuse")}</h3>
          <ExcuseForm students={students} lang={lang} />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">{t("excuses.recentExcuses")}</h3>
          
          {excuses.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted)]">
              {t("excuses.noExcuses")}
            </div>
          ) : (
            <div className="space-y-3">
              {excuses.map(excuse => (
                <div key={excuse.id} className="list-row flex items-start justify-between p-4">
                  <div>
                    <h4 className="font-bold text-[var(--color-ink)] text-sm">{excuse.studentName}</h4>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      <span className="font-semibold text-[color-mix(in_srgb,var(--color-green)_84%,white)]">{t("excuses.date")}:</span> {excuse.excuseDate}
                    </p>
                    <p className="text-sm mt-2 text-[var(--color-muted)] italic">&quot;{excuse.reason}&quot;</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold">
                      {t("excuses.logged")} {formatDateTime(excuse.createdAt)}
                    </span>
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={excuse.id} />
                      <button className="btn btn--danger px-2 py-1 text-xs">
                        {t("excuses.revokeDelete")}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
