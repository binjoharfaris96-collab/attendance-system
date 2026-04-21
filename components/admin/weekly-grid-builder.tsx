"use client";

import { useState } from "react";
import { saveWeeklyScheduleAction } from "@/app/actions/admin";
import { Save, Plus, Trash2, Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type GridCell = {
  teacherId: string;
  subject: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_PERIODS = [
  { startTime: "08:00", endTime: "08:45" },
  { startTime: "09:00", endTime: "09:45" },
  { startTime: "10:00", endTime: "10:45" },
  { startTime: "11:15", endTime: "12:00" },
  { startTime: "12:15", endTime: "13:00" },
  { startTime: "13:15", endTime: "14:00" },
];

export function WeeklyGridBuilder({
  classes,
  teachers,
}: {
  classes: { id: string; name: string }[];
  teachers: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [periods, setPeriods] = useState([...DEFAULT_PERIODS]);
  const [cells, setCells] = useState<Record<string, GridCell>>({}); // key: "day-periodIndex"
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCellChange = (day: string, pIndex: number, field: "teacherId" | "subject", value: string) => {
    const key = `${day}-${pIndex}`;
    setCells(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleAddPeriod = () => {
    setPeriods([...periods, { startTime: "14:15", endTime: "15:00" }]);
  };

  const handleRemovePeriod = (index: number) => {
    if (periods.length <= 1) return;
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const handlePeriodTimeChange = (index: number, field: "startTime" | "endTime", value: string) => {
    const newPeriods = [...periods];
    newPeriods[index][field] = value;
    setPeriods(newPeriods);
  };

  const handleSave = async () => {
    setError("");
    setShowSuccess(false);
    if (!selectedClassId) {
      setError("Please select a target class before saving.");
      return;
    }

    setIsSaving(true);
    const payloadSchedules: any[] = [];

    for (const day of DAYS) {
      for (let pIndex = 0; pIndex < periods.length; pIndex++) {
        const period = periods[pIndex];
        const cell = cells[`${day}-${pIndex}`];
        
        // Defensive check: Ensure cell and subject exist and subject is a non-empty string after trim
        const subject = cell?.subject;
        const teacherId = cell?.teacherId;
        
        if (teacherId && typeof subject === 'string' && subject.trim()) {
          payloadSchedules.push({
            teacherId,
            subject: subject.trim(),
            dayOfWeek: day,
            startTime: period.startTime,
            endTime: period.endTime,
          });
        }
      }
    }

    if (payloadSchedules.length === 0) {
      setError("The grid is empty. Fill at least one slot.");
      setIsSaving(false);
      return;
    }

    const result = await saveWeeklyScheduleAction({ classId: selectedClassId, schedules: payloadSchedules });
    
    if (result.error) {
      setError(result.error);
    } else {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      router.refresh();
    }
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Header & Class Picker */}
      <div className="card p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:translate-y-0">
        <div className="flex-1 space-y-3">
          <label className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-widest flex items-center gap-2 px-1">
            <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
            Class Timetable Mapper
          </label>
          <div className="relative group">
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="field-input w-full md:max-w-md appearance-none px-6 py-4 font-bold cursor-pointer"
            >
              <option value="">-- Choose target classroom --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">
              <Plus className="w-5 h-5 rotate-45" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3 min-w-[200px]">
          <button 
            onClick={handleSave}
            disabled={isSaving || !selectedClassId}
            className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95 flex items-center gap-3 ${
              isSaving 
               ? 'border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] text-[var(--color-muted)]' 
               : 'bg-[var(--color-accent)] text-white hover:bg-[color-mix(in_srgb,var(--color-accent)_92%,white)]'
            }`}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-[var(--color-line)] border-t-[var(--color-ink)] rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {isSaving ? "Syncing..." : "Apply Changes"}
          </button>
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-bounce">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Schedule Synchronized!
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Grid */}
      {selectedClassId ? (
        <div className="bg-[var(--surface-1)] rounded-3xl border border-[var(--color-line)] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] border-b border-[var(--color-line)]">
                  <th className="p-4 w-[120px] text-center border-r border-[var(--color-line)] bg-[var(--surface-1)] sticky left-0 z-10">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Clock className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Timeline</span>
                    </div>
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-4 text-center w-[160px] border-r border-[var(--color-line)]">
                      <span className="text-sm font-black text-[var(--color-ink)] uppercase tracking-widest block">{day}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {periods.map((period, pIndex) => (
                  <tr key={pIndex} className="group border-b border-[var(--color-line)]">
                    {/* Period Row Header */}
                    <td className="p-3 border-r border-[var(--color-line)] sticky left-0 bg-[var(--surface-1)] z-10">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] border border-[color-mix(in_srgb,var(--color-accent)_25%,transparent)] px-1.5 py-0.5 rounded uppercase">Period {pIndex + 1}</span>
                          <button 
                            onClick={() => handleRemovePeriod(pIndex)}
                            className="hidden group-hover:block p-1 text-[var(--color-muted)] hover:text-[color-mix(in_srgb,var(--color-red)_90%,white)] hover:bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] rounded transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          <input 
                            type="time" 
                            value={period.startTime} 
                            onChange={(e) => handlePeriodTimeChange(pIndex, "startTime", e.target.value)}
                            className="text-[11px] font-bold bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] border border-[var(--color-line)] rounded-lg px-2 py-1 outline-none focus:border-[color-mix(in_srgb,var(--color-accent)_60%,var(--color-line))] transition-all text-center text-[var(--color-ink)]"
                          />
                          <input 
                            type="time" 
                            value={period.endTime} 
                            onChange={(e) => handlePeriodTimeChange(pIndex, "endTime", e.target.value)}
                            className="text-[11px] font-bold bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] border border-[var(--color-line)] rounded-lg px-2 py-1 outline-none focus:border-[color-mix(in_srgb,var(--color-accent)_60%,var(--color-line))] transition-all text-center text-[var(--color-ink)]"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Day-Specific Data Cells */}
                    {DAYS.map(day => {
                      const key = `${day}-${pIndex}`;
                      const cell = cells[key] || { teacherId: "", subject: "" };

                      return (
                        <td key={key} className="p-2 border-r border-[var(--color-line)] align-top bg-[var(--surface-1)]">
                          <div className="flex flex-col gap-2 h-full">
                            <input 
                              type="text" 
                              placeholder="Subject Name" 
                              value={cell.subject || ""}
                              onChange={e => handleCellChange(day, pIndex, "subject", e.target.value)}
                              className="text-xs font-bold text-[var(--color-ink)] placeholder:text-[color-mix(in_srgb,var(--color-muted)_65%,transparent)] bg-transparent border-none outline-none focus:placeholder:opacity-0 transition-opacity"
                            />
                            <div className="relative group/sel">
                              <select 
                                value={cell.teacherId || ""}
                                onChange={e => handleCellChange(day, pIndex, "teacherId", e.target.value)}
                                className={`w-full text-[10px] font-black uppercase tracking-tight bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--surface-1)_80%,transparent)] border border-[var(--color-line)] rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-accent)_24%,transparent)] transition-all appearance-none cursor-pointer ${
                                  !cell.teacherId ? 'text-[var(--color-muted)]' : 'text-[var(--color-accent)] border-[color-mix(in_srgb,var(--color-accent)_25%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]'
                                }`}
                              >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.fullName}</option>
                                ))}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                <Plus className="w-3 h-3 text-[var(--color-muted)]" />
                              </div>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-[color-mix(in_srgb,var(--surface-2)_60%,transparent)] border-t border-[var(--color-line)] flex justify-center">
             <button 
                onClick={handleAddPeriod}
                className="group px-6 py-2.5 border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_76%,transparent)] rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-line))] hover:shadow-lg transition-all"
             >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Append New Period Row
             </button>
           </div>
        </div>
      ) : (
        <div className="py-24 text-center bg-[color-mix(in_srgb,var(--surface-2)_60%,transparent)] rounded-[40px] border border-dashed border-[var(--color-line)] flex flex-col items-center gap-6 group">
           <div className="w-20 h-20 bg-[color-mix(in_srgb,var(--surface-1)_76%,transparent)] border border-[var(--color-line)] rounded-3xl shadow-xl flex items-center justify-center text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:scale-110 transition-all duration-500">
             <Calendar className="w-10 h-10" />
           </div>
           <div className="space-y-1">
             <p className="text-[var(--color-ink)] font-black text-xl">No Classroom Selected</p>
             <p className="text-[var(--color-muted)] text-sm max-w-xs mx-auto">Please select a target class above to start building its comprehensive weekly 7-day schedule.</p>
            </div>
         </div>
      )}
    </div>
  );
}
