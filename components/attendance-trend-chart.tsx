import { formatDateLabel } from "@/lib/time";
import { t, type AppLanguage } from "@/lib/i18n";

type DailyCount = {
  day: string;
  total: number;
};

export function AttendanceTrendChart({
  dailyCounts,
  lang = "en",
}: {
  dailyCounts: DailyCount[];
  lang?: AppLanguage;
}) {
  const chartData = dailyCounts.map((entry) => ({
    shortDate: formatDateLabel(entry.day).replace(",", ""),
    total: Number(entry.total) || 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="chart-shell mt-4 border-dashed text-center text-sm text-[var(--color-muted)]">
        {t("stats.noData", lang)}
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map((item) => item.total), 1);

  return (
    <div className="chart-shell mt-4">
      <div className="overflow-x-auto">
        <div
          className="grid h-[260px] min-w-[680px] gap-2"
          style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
        >
          {chartData.map((entry, index) => {
            const ratio = entry.total / maxValue;
            const heightPercent = Math.max(8, Math.round(ratio * 100));

            return (
              <div
                key={`${entry.shortDate}-${index}`}
                className="flex min-w-0 flex-col items-center justify-end gap-1"
                title={`${entry.shortDate}: ${entry.total}`}
              >
                <span className="text-[10px] font-semibold text-[var(--color-muted)]">
                  {entry.total}
                </span>
                <div className="relative flex h-[185px] w-full items-end justify-center rounded-md border border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface-2)_52%,transparent)] px-1 pb-1">
                  <div
                    className="w-full rounded-[6px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-accent)_86%,white)_0%,color-mix(in_srgb,var(--color-accent)_64%,var(--surface-2))_100%)] shadow-[0_8px_18px_color-mix(in_srgb,var(--color-accent)_28%,transparent)]"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="w-full truncate text-center text-[10px] text-[var(--color-muted)]">
                  {entry.shortDate}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
