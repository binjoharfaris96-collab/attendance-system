"use client";

import { useState } from "react";
import { saveWeeklyScheduleAction } from "@/app/actions/admin";
import { Save, Plus, Trash2, Clock, CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type GridCell = {
  teacherId: string;
  subject: string;
};

// Default periods for Saudi Arabian school system (typically 7 periods)
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const DEFAULT_PERIODS = [
  { startTime: "07:00", endTime: "07:45" },
  { startTime: "07:45", endTime: "08:30" },
  { startTime: "08:30", endTime: "09:15" },
  { startTime: "09:15", endTime: "10:00" }, /* Break often here */
  { startTime: "10:30", endTime: "11:15" },
  { startTime: "11:15", endTime: "12:00" },
  { startTime: "12:00", endTime: "12:45" },
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
    setPeriods([...periods, { startTime: "13:00", endTime: "13:45" }]);
  };

  const handleRemovePeriod = (index: number) => {
    if (periods.length <= 1) return;
    setPeriods(periods.filter((_, i) => i !== index));
    // Optionally clean up cells
  };

  const handlePeriodTimeChange = (index: number, field: "startTime" | "endTime", value: string) => {
    const newPeriods = [...periods];
    newPeriods[index][field] = value;
    setPeriods(newPeriods);
  };

  const handleSave = async () => {
    setError("");
    if (!selectedClassId) {
      setError("Please select a target class before saving.");
      return;
    }

    setIsSaving(true);

    const payloadSchedules: Array<{ teacherId: string; subject: string; dayOfWeek: string; startTime: string; endTime: string }> = [];

    // Assemble payload
    for (const day of DAYS) {
      periods.forEach((period, pIndex) => {
        const key = `${day}-${pIndex}`;
        const cell = cells[key];
        
        // Only include if they filled out *both*
        if (cell && cell.teacherId && cell.subject.trim()) {
          payloadSchedules.push({
            teacherId: cell.teacherId,
            subject: cell.subject.trim(),
            dayOfWeek: day,
            startTime: period.startTime,
            endTime: period.endTime,
          });
        }
      });
    }

    if (payloadSchedules.length === 0) {
      setError("Grid is completely empty. Please fill at least one period.");
      setIsSaving(false);
      return;
    }

    const result = await saveWeeklyScheduleAction({ classId: selectedClassId, schedules: payloadSchedules });
    
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
      // Optional: Show success toast
      alert("Weekly schedule successfully mapped to classroom!");
    }
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Configuration Bar */}
      <div className="card border-l-4 border-l-[var(--color-accent)] bg-[var(--surface-1)]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold text-[var(--color-ink)] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--color-accent)]" />
              Target Class Configuration
            </label>
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="input w-full md:max-w-md bg-[var(--surface-2)] font-semibold"
            >
              <option value="">-- Select a Class to Map --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-muted)]">
              Any previously saved schedules for this specific classroom will be entirely overwritten.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <button 
              onClick={handleSave}
              disabled={isSaving || !selectedClassId}
              className="btn btn--primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-[var(--color-accent)]/20"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Synchronizing Grid..." : "Publish Weekly Grid"}
            </button>
            {error && <p className="text-red-500 text-xs font-bold mt-2 text-right">{error}</p>}
          </div>
        </div>
      </div>

      {/* Grid Container */}
      {selectedClassId && (
        <div className="card p-0 overflow-hidden border border-[var(--color-line)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[var(--surface-2)]">
                <tr>
                  <th className="p-4 border-b border-r border-[var(--color-line)] w-[200px] text-xs uppercase tracking-widest text-[var(--color-muted)] font-black text-center relative">
                    Time Block (Row) \ Day (Col)
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                       <Clock className="w-12 h-12" />
                    </div>
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-4 border-b border-r border-[var(--color-line)] text-center text-[var(--color-ink)] font-bold">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period, pIndex) => (
                  <tr key={pIndex} className="bg-[color-mix(in_srgb,var(--surface-1)_98%,transparent)]">
                    {/* Period Time Configuration Column */}
                    <td className="p-3 border-b border-r border-[var(--color-line)] align-top bg-[var(--surface-2)]/30 w-[200px]">
                      <div className="flex flex-col gap-2 relative group">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--color-muted)]">Period {pIndex + 1}</span>
                            <button 
                              onClick={() => handleRemovePeriod(pIndex)}
                              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Period Row"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                         </div>
                         <div className="flex items-center gap-1.5 w-full">
                           <input 
                              type="time" 
                              value={period.startTime} 
                              onChange={(e) => handlePeriodTimeChange(pIndex, "startTime", e.target.value)}
                              className="input text-[11px] px-1 py-1 h-auto flex-1 text-center font-mono"
                           />
                           <span className="text-[var(--color-muted)] text-[10px]">-</span>
                           <input 
                              type="time" 
                              value={period.endTime} 
                              onChange={(e) => handlePeriodTimeChange(pIndex, "endTime", e.target.value)}
                              className="input text-[11px] px-1 py-1 h-auto flex-1 text-center font-mono"
                           />
                         </div>
                      </div>
                    </td>

                    {/* Day Cells corresponding to this Period */}
                    {DAYS.map(day => {
                      const key = `${day}-${pIndex}`;
                      const cell = cells[key] || { teacherId: "", subject: "" };
                      
                      return (
                        <td key={key} className="p-2 border-b border-r border-[var(--color-line)] align-top transition-colors focus-within:bg-[var(--surface-2)]">
                          <div className="space-y-1.5 flex flex-col h-full">
                            <input 
                              type="text" 
                              placeholder="e.g. Mathematics" 
                              value={cell.subject || ""}
                              onChange={e => handleCellChange(day, pIndex, "subject", e.target.value)}
                              className="input text-[11px] py-1.5 h-auto w-full bg-transparent border-transparent hover:border-[var(--color-line)] focus:bg-[var(--surface-1)]"
                            />
                            <select 
                              value={cell.teacherId || ""}
                              onChange={e => handleCellChange(day, pIndex, "teacherId", e.target.value)}
                              className={`input text-[11px] py-1 h-auto w-full ${!cell.teacherId ? 'text-[var(--color-muted)] italic' : 'text-[var(--color-accent)] font-semibold'}`}
                            >
                              <option value="">[ No Teacher ]</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.fullName}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-[var(--surface-2)] border-t border-[var(--color-line)] flex justify-center">
             <button 
                onClick={handleAddPeriod}
                className="btn text-xs px-4 py-1.5 flex items-center gap-1.5 text-[var(--color-ink)] hover:text-[var(--color-accent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
             >
                <Plus className="w-3 h-3" />
                Add Period Row
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
