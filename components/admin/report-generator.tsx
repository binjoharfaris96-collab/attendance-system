"use client";

import { useState } from "react";
import { Download, FileText, Calendar, Filter } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
}

export function ReportGenerator({ classes }: { classes: ClassOption[] }) {
  const [classId, setClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  function handleExport() {
    setIsExporting(true);
    const params = new URLSearchParams();
    if (classId) params.append("classId", classId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    
    window.location.href = `/api/export-attendance?${params.toString()}`;
    
    setTimeout(() => setIsExporting(false), 2000);
  }

  return (
    <div className="card space-y-6 border-t-4 border-t-emerald-500">
      <div className="flex items-center space-x-2 text-emerald-600">
        <FileText className="w-5 h-5" />
        <h2 className="text-lg font-bold">Custom Report Generator</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter by Class
          </label>
          <select 
            value={classId} 
            onChange={(e) => setClassId(e.target.value)}
            className="input w-full"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Start Date
          </label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="input w-full" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3" /> End Date
          </label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="input w-full" 
          />
        </div>
      </div>

      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="btn btn--primary w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        {isExporting ? "Generating..." : "Download CSV Report"}
      </button>

      <p className="text-[10px] text-[var(--color-muted)] text-center italic">
        Report will include all attendance snapshots, notes, and sources for the selected period.
      </p>
    </div>
  );
}
