"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ 
  id, 
  onDelete, 
  className = "p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg" 
}: { 
  id: string; 
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button 
      onClick={() => {
        if (confirm("Are you sure you want to delete this?")) {
          startTransition(async () => {
            const result = await onDelete(id);
            if (result.error) alert(result.error);
          });
        }
      }}
      disabled={isPending}
      className={className}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
