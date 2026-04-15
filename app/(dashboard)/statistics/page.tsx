import { getSchoolwideStats, getAtRiskStudents, listAllClasses } from "@/lib/db";
import { TrendingUp, AlertTriangle, BarChart3, Users, Award, Percent } from "lucide-react";
import { ReportGenerator } from "@/components/admin/report-generator";

export default async function StatisticsPage() {
  const stats = await getSchoolwideStats();
  const atRisk = await getAtRiskStudents(80); // <80% is at risk
  const classes = await listAllClasses();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          Attendance Analytics
        </h1>
        <p className="text-[var(--color-muted)]">
          School-wide performance monitoring and risk detection.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Top Cards */}
        <div className="card bg-emerald-500 p-6 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Award className="w-16 h-16" />
           </div>
           <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Top Performing Class</p>
           <p className="text-2xl font-black mt-2">
              {[...stats.classPerformance].sort((a,b) => b.rate - a.rate)[0]?.name || "N/A"}
           </p>
           <p className="text-sm mt-1 text-emerald-500 bg-white/90 w-fit px-2 py-0.5 rounded-full font-bold">
              {Math.max(...stats.classPerformance.map(c => c.rate), 0)}% Attendance
           </p>
        </div>

        <div className="card bg-red-500 p-6 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-16 h-16" />
           </div>
           <p className="text-xs font-bold uppercase tracking-widest text-red-100">At-Risk Students</p>
           <p className="text-4xl font-black mt-2">{atRisk.length}</p>
           <p className="text-sm mt-1 text-red-100">Attendance below 80%</p>
        </div>

        <div className="card p-6 border-l-4 border-l-blue-500">
           <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Avg. Attendance</p>
              <Percent className="w-4 h-4 text-blue-500" />
           </div>
           <p className="text-4xl font-black text-[var(--color-ink)]">
              {Math.round(stats.classPerformance.reduce((acc,c) => acc + c.rate, 0) / (stats.classPerformance.length || 1))}%
           </p>
        </div>

        <div className="card p-6 border-l-4 border-l-purple-500">
           <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Recorded Sessions</p>
              <TrendingUp className="w-4 h-4 text-purple-500" />
           </div>
           <p className="text-4xl font-black text-[var(--color-ink)]">
              {stats.trends.length} <span className="text-xs text-[var(--color-muted)] font-bold">Days</span>
           </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* At Risk List */}
        <div className="lg:col-span-2 space-y-4">
           <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)] flex items-center justify-between">
                 <h3 className="font-bold flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    At-Risk Monitor
                 </h3>
                 <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Urgent Attention Required</span>
              </div>
              <div className="divide-y divide-[var(--color-line)]">
                 {atRisk.length === 0 ? (
                    <div className="p-12 text-center text-[var(--color-muted)] italic">
                       All students meet the 80% attendance threshold.
                    </div>
                 ) : (
                    atRisk.map(s => (
                       <div key={s.id} className="p-4 flex items-center justify-between hover:bg-red-50/30 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                {s.rate}%
                             </div>
                             <div>
                                <p className="font-bold text-[var(--color-ink)]">{s.fullName}</p>
                                <p className="text-xs text-[var(--color-muted)]">{s.className} &middot; {s.studentCode}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-bold text-red-600">Critical</span>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Trend Chart (Simple CSS implementation) */}
           <div className="card space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    14-Day Check-in Trend
                 </h3>
              </div>
              <div className="h-48 flex items-end justify-between items-stretch gap-1 pt-4">
                 {[...stats.trends].reverse().map((t, i) => {
                    const maxCount = Math.max(...stats.trends.map(x => x.count), 1);
                    const height = (t.count / maxCount) * 100;
                    return (
                       <div key={i} className="flex-1 flex flex-col justify-end group gap-2">
                          <div 
                             className="bg-blue-500/20 group-hover:bg-blue-500 transition-all rounded-t-lg relative"
                             style={{ height: `${height}%` }}
                          >
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {t.count} check-ins
                             </div>
                          </div>
                          <div className="text-[8px] text-[var(--color-muted)] font-bold text-center truncate rotate-45 origin-left h-8">
                             {t.date.split('-').slice(1).join('/')}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        </div>

        {/* Right Sidebar: Reports & Class Performance */}
        <div className="space-y-6">
           <ReportGenerator classes={classes.map(c => ({ id: c.id, name: c.name }))} />

           <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)]">
                 <h3 className="font-bold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    Class Ranks
                 </h3>
              </div>
              <div className="divide-y divide-[var(--color-line)]">
                 {stats.classPerformance.sort((a,b) => b.rate - a.rate).map(c => (
                    <div key={c.name} className="p-4 space-y-2">
                       <div className="flex justify-between text-sm">
                          <span className="font-bold text-[var(--color-ink)]">{c.name}</span>
                          <span className="font-bold text-purple-600">{c.rate}%</span>
                       </div>
                       <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${c.rate}%` }}></div>
                       </div>
                       <p className="text-[10px] text-[var(--color-muted)]">
                          {c.present} / {c.total} students present today
                       </p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
