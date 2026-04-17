import { getTeacherById, getTeacherClasses, getUnlinkedUsers, listTeachers } from "@/lib/db";
import { getAppLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { GraduationCap, BookOpen, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TeacherLinkingForm } from "@/components/admin/teacher-linking-form";
import { deleteTeacherAction } from "@/app/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function TeacherDetailPage({ params }: { params: Promise<{ teacherId: string }> }) {
  const { teacherId } = await params;
  const teacher = await getTeacherById(teacherId);
  if (!teacher) notFound();

  const classes = await getTeacherClasses(teacherId);
  const unlinkedUsers = await getUnlinkedUsers("teacher");
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  // Find linked user email if exists
  const teachers = await listTeachers();
  const teacherRecord = teachers.find(t => t.id === teacherId);
  const userEmail = teacherRecord?.userEmail || null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link 
          href="/teachers" 
          className="inline-flex items-center text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Teachers
        </Link>
        
        <DeleteButton 
          id={teacherId} 
          onDelete={deleteTeacherAction}
          className="btn text-red-600 hover:bg-red-50 flex items-center gap-2 border border-red-200"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="card space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <GraduationCap className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-ink)]">{teacher.fullName}</h2>
              <p className="text-[var(--color-muted)] font-medium">{teacher.department || "Faculty Member"}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--color-line)]">
             <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Record ID</span>
                <span className="font-mono text-[var(--color-ink)]">{teacherId.slice(0, 8)}...</span>
             </div>
             <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-muted)]">Digital Link</span>
                {teacher.userId ? (
                   <span className="font-bold text-emerald-600">Connected</span>
                ) : (
                   <span className="font-bold text-amber-600">Disconnected</span>
                )}
             </div>
          </div>
        </div>

        {/* Classes & Linking */}
        <div className="md:col-span-2 space-y-6">
           {/* Linking Form */}
           <TeacherLinkingForm 
             teacherId={teacherId}
             currentUserId={teacher.userId}
             currentUserEmail={userEmail}
             unlinkedUsers={unlinkedUsers}
           />

           {/* Assigned Classes */}
           <div className="card p-0 overflow-hidden">
             <div className="p-4 border-b border-[var(--color-line)] bg-[var(--surface-2)]">
               <h3 className="font-bold flex items-center gap-2">
                 <BookOpen className="w-4 h-4 text-purple-500" />
                 Assigned Classes ({classes.length})
               </h3>
             </div>
             <div className="divide-y divide-[var(--color-line)]">
               {classes.length === 0 ? (
                 <div className="p-8 text-center text-[var(--color-muted)] italic">
                   No classes assigned to this teacher yet.
                 </div>
               ) : (
                 classes.map((cls) => (
                   <div key={cls.id} className="flex items-center justify-between p-4">
                     <div className="flex items-center space-x-3">
                        <div className="bg-purple-500/10 p-2 rounded-lg text-purple-600">
                           <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-ink)]">{cls.name}</p>
                          <p className="text-xs text-[var(--color-muted)]">{cls.subject || "No Subject"}</p>
                        </div>
                     </div>
                     <span className="text-sm font-medium text-[var(--color-muted)]">{cls.studentCount} Students</span>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
