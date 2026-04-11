"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { AppLanguage } from "@/lib/i18n";
import type { TodayAttendanceBreakdown } from "@/lib/types";

const FILLS = {
  onTime: "var(--color-green)",
  late: "var(--color-amber)",
  absent: "var(--color-red)",
} as const;

type Segment = {
  key: keyof typeof FILLS;
  name: string;
  value: number;
  fill: string;
};

export function AttendanceStatusPieChart({
  breakdown,
  labels,
  lang,
}: {
  breakdown: TodayAttendanceBreakdown;
  labels: {
    onTime: string;
    late: string;
    absent: string;
    noStudents: string;
  };
  lang: AppLanguage;
}) {
  if (breakdown.totalStudents <= 0) {
    return (
      <div
        className="chart-shell mt-4 border-dashed text-center text-sm text-[var(--color-muted)]"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {labels.noStudents}
      </div>
    );
  }

  const allSegments: Segment[] = [
    { key: "onTime", name: labels.onTime, value: breakdown.onTime, fill: FILLS.onTime },
    { key: "late", name: labels.late, value: breakdown.late, fill: FILLS.late },
    { key: "absent", name: labels.absent, value: breakdown.absent, fill: FILLS.absent },
  ];
  const segments = allSegments.filter((s) => s.value > 0);

  if (segments.length === 0) {
    return (
      <div
        className="chart-shell mt-4 border-dashed text-center text-sm text-[var(--color-muted)]"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {labels.noStudents}
      </div>
    );
  }

  const total = breakdown.totalStudents;

  return (
    <div className="mt-4 space-y-1" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="h-[280px] w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              stroke="var(--color-line)"
              strokeWidth={1}
            >
              {segments.map((s) => (
                <Cell key={s.key} fill={s.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                if (value === undefined) {
                  return ["—", name ?? ""];
                }
                const scalar = Array.isArray(value) ? value[0] : value;
                const n =
                  typeof scalar === "number" ? scalar : Number(String(scalar));
                const safe = Number.isFinite(n) ? n : 0;
                const pct =
                  total > 0 ? Math.round((safe / total) * 1000) / 10 : 0;
                return [`${safe} (${pct}%)`, name ?? ""];
              }}
              contentStyle={{
                background: "var(--surface-1)",
                border: "1px solid color-mix(in srgb, var(--color-line) 70%, transparent)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--color-ink)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={28}
              formatter={(value) => (
                <span className="text-xs text-[var(--color-muted)]">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
