"use client";

import { useTransition } from "react";
import { MinusCircle } from "lucide-react";
import { unenrollStudentAction } from "@/app/actions/admin";

export function UnenrollButton({ 
  classId, 
  studentId 
}: { 
  classId: string; 
  studentId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button 
      onClick={() => {
        if (confirm("Are you sure you want to remove this student from the class?")) {
          const formData = new FormData();
          formData.append("classId", classId);
          formData.append("studentId", studentId);
          
          startTransition(async () => {
            const result = await unenrollStudentAction(formData);
            if (result.error) alert(result.error);
          });
        }
      }}
      disabled={isPending}
      className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg disabled:opacity-50" 
      title="Remove from class"
    >
      <MinusCircle className="w-4 h-4" />
    </button>
  );
}
