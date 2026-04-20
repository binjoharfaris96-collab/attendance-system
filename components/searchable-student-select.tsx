"use client";

import { useState } from "react";
import { UserCircle } from "lucide-react";

interface StudentMinimal {
  id: string;
  fullName: string;
  studentCode: string;
}

export function SearchableStudentSelect({ 
  students 
}: { 
  students: StudentMinimal[] 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentMinimal | null>(null);

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50); // limit to keep UI snappy

  return (
    <div className="relative flex-1">
      <input type="hidden" name="studentId" value={selectedStudent?.id || ""} required />
      
      {selectedStudent ? (
         <div className="flex items-center justify-between p-2.5 border border-emerald-500/30 bg-emerald-500/10 rounded-xl cursor-pointer" onClick={() => setSelectedStudent(null)}>
            <div className="flex flex-col ml-2">
               <span className="text-sm font-bold text-[var(--color-ink)]">{selectedStudent.fullName}</span>
               <span className="text-[10px] text-[var(--color-muted)]">Code: {selectedStudent.studentCode}</span>
            </div>
            <button type="button" className="text-xs text-red-500 hover:bg-red-500/10 px-2 py-1 rounded">Clear</button>
         </div>
      ) : (
         <div className="relative">
            <input 
               type="text" 
               className="field-input w-full" 
               placeholder="Search student name or code..."
               value={searchTerm}
               onChange={e => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
               }}
               onFocus={() => setIsOpen(true)}
            />
            
            {isOpen && (
               <div className="absolute z-50 top-full mt-2 w-full max-h-[220px] overflow-y-auto border border-[var(--color-line)] rounded-xl bg-[var(--surface-1)] shadow-xl backdrop-blur-2xl">
                  {filteredStudents.length === 0 ? (
                     <div className="p-4 text-center text-xs text-[var(--color-muted)]">No students found matching your search.</div>
                  ) : (
                     filteredStudents.map(s => (
                        <button 
                           key={s.id}
                           type="button"
                           onClick={() => {
                              setSelectedStudent(s);
                              setIsOpen(false);
                              setSearchTerm("");
                           }}
                           className="w-full flex items-center gap-3 p-3 hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--surface-2))] text-left border-b border-[var(--color-line)] last:border-0 transition-colors"
                        >
                           <div className="bg-[var(--surface-0)] rounded-full p-2 border border-[var(--color-line)]">
                              <UserCircle className="w-4 h-4 text-[var(--color-accent)]" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-[var(--color-ink)]">{s.fullName}</span>
                              <span className="text-[10px] text-[var(--color-muted)] tracking-wider">Code: {s.studentCode}</span>
                           </div>
                        </button>
                     ))
                  )}
               </div>
            )}
         </div>
      )}
    </div>
  );
}
