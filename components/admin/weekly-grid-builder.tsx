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
      periods.forEach((period, pIndex) => {
        const key = `${day}-${pIndex}`;
        const cell = cells[key];
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
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300">
        <div className="flex-1 space-y-3">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Class Timetable Mapper
          </label>
          <div className="relative group">
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full md:max-w-md appearance-none px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 cursor-pointer shadow-inner"
            >
              <option value="">-- Choose target classroom --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
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
               ? 'bg-slate-100 text-slate-400' 
               : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-200'
            }`}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
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
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-4 w-[160px] text-center border-r border-slate-100 bg-white sticky left-0 z-10">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Clock className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Timeline</span>
                    </div>
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="p-5 text-center min-w-[180px] border-r border-slate-100">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-widest block">{day}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Regular Slot</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {periods.map((period, pIndex) => (
                  <tr key={pIndex} className="group hover:bg-slate-50/30 transition-colors">
                    {/* Period Row Header */}
                    <td className="p-4 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-lg shadow-slate-100 md:shadow-none transition-shadow group-hover:shadow-indigo-50">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">Period {pIndex + 1}</span>
                          <button 
                            onClick={() => handleRemovePeriod(pIndex)}
                            className="hidden group-hover:block p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          <input 
                            type="time" 
                            value={period.startTime} 
                            onChange={(e) => handlePeriodTimeChange(pIndex, "startTime", e.target.value)}
                            className="text-[11px] font-bold bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 outline-none focus:bg-white focus:border-indigo-200 transition-all text-center text-slate-700"
                          />
                          <input 
                            type="time" 
                            value={period.endTime} 
                            onChange={(e) => handlePeriodTimeChange(pIndex, "endTime", e.target.value)}
                            className="text-[11px] font-bold bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 outline-none focus:bg-white focus:border-indigo-200 transition-all text-center text-slate-700"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Day-Specific Data Cells */}
                    {DAYS.map(day => {
                      const key = `${day}-${pIndex}`;
                      const cell = cells[key] || { teacherId: "", subject: "" };
                      const hasData = cell.teacherId && cell.subject;

                      return (
                        <td key={key} className={`p-3 border-r border-slate-50 align-top transition-all duration-300 focus-within:bg-indigo-50/20 ${hasData ? 'bg-emerald-50/5' : ''}`}>
                          <div className="flex flex-col gap-2 h-full">
                            <input 
                              type="text" 
                              placeholder="Subject Name" 
                              value={cell.subject || ""}
                              onChange={e => handleCellChange(day, pIndex, "subject", e.target.value)}
                              className="text-xs font-bold text-slate-900 placeholder:text-slate-200 bg-transparent border-none outline-none focus:placeholder:opacity-0 transition-opacity"
                            />
                            <div className="relative group/sel">
                              <select 
                                value={cell.teacherId || ""}
                                onChange={e => handleCellChange(day, pIndex, "teacherId", e.target.value)}
                                className={`w-full text-[10px] font-black uppercase tracking-tight bg-slate-50/50 hover:bg-white border border-slate-100 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer ${
                                  !cell.teacherId ? 'text-slate-300' : 'text-indigo-600 border-indigo-100 bg-white'
                                }`}
                              >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.fullName}</option>
                                ))}
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                <Plus className="w-3 h-3 text-slate-900" />
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
          
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
             <button 
                onClick={handleAddPeriod}
                className="group px-6 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all"
             >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                Append New Period Row
             </button>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center gap-6 group">
           <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-200 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500">
             <Calendar className="w-10 h-10" />
           </div>
           <div className="space-y-1">
             <p className="text-slate-600 font-black text-xl">No Classroom Selected</p>
             <p className="text-slate-400 text-sm max-w-xs mx-auto">Please select a target class above to start building its comprehensive weekly 7-day schedule.</p>
           </div>
        </div>
      )}
    </div>
  );
}
