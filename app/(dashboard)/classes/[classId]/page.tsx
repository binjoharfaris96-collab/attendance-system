import { getClassWithRoster, listTeachers, listStudents } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, GraduationCap, User } from "lucide-react";
import Link from "next/link";
import { EnrollmentForm } from "@/components/admin/enrollment-form";
import { deleteClassAction } from "@/app/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { UnenrollButton } from "@/components/admin/unenroll-button";

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const classData = await getClassWithRoster(classId);
  if (!classData) notFound();

  const allStudents = await listStudents();
  const teachers = await listTeachers();

  // Filter out students already in this class
  const enrolledIds = new Set(classData.students.map(s => s.id));
  const availableStudents = allStudents
    .filter(s => !enrolledIds.has(s.id))
    .map(s => ({ id: s.id, fullName: s.fullName, studentCode: s.studentCode }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link 
          href="/classes" 
          className="inline-flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Classes
        </Link>
        
        <DeleteButton 
          id={classId} 
          onDelete={deleteClassAction}
          className="btn btn--danger flex items-center gap-2"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Class Info & Enrollment */}
        <div className="space-y-6">
          <div className="card space-y-4 border-l-4 border-l-purple-500">
             <div>
                <h2 className="text-2xl font-bold text-[var(--color-ink)]">{classData.name}</h2>
                <p className="text-[var(--color-muted)] font-medium">{classData.subject || "General Section"}</p>
             </div>
             
             <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                 <div className="w-10 h-10 rounded-lg bg-[var(--surface-1)] border border-[var(--color-line)] flex items-center justify-center text-purple-400 shadow-sm">
                   <GraduationCap className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">Instructor</p>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{classData.teacherName}</p>
                 </div>
              </div>
          </div>

          <EnrollmentForm 
            classId={classId} 
            availableStudents={availableStudents} 
          />
        </div>

        {/* Roster List */}
        <div className="md:col-span-2 card p-0 overflow-hidden">
           <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)] flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Student Roster ({classData.students.length})
              </h3>
           </div>
           
           <div className="divide-y divide-[var(--color-line)]">
              {classData.students.length === 0 ? (
                <div className="p-12 text-center text-[var(--color-muted)] italic">
                  This class is currently empty. Use the enrollment tool to add students.
                </div>
              ) : (
                classData.students.map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-4 hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                         <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-ink)]">{student.fullName}</p>
                        <p className="text-xs text-[var(--color-muted)] font-mono">{student.studentCode}</p>
                      </div>
                    </div>
                    
                    <UnenrollButton 
                      classId={classId} 
                      studentId={student.id} 
                    />
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
