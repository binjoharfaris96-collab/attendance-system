"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ 
  id, 
  onDelete, 
  className = "p-2 text-[color-mix(in_srgb,var(--color-red)_90%,white)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[color-mix(in_srgb,var(--color-red)_12%,transparent)] rounded-lg" 
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
