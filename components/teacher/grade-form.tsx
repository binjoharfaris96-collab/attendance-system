"use client";

import { gradeSubmissionAction } from "@/app/actions/assignments";
import { useState } from "react";
import { Check, Edit2 } from "lucide-react";

export function GradeForm({ 
  submissionId, 
  assignmentId, 
  maxPoints, 
  currentScore, 
  currentFeedback 
}: { 
  submissionId: string; 
  assignmentId: string; 
  maxPoints: number;
  currentScore: number | null;
  currentFeedback: string | null;
}) {
  const [isPending, setIsPending] = useState(false);
  const [score, setScore] = useState<number | string>(currentScore ?? "");
  const [feedback, setFeedback] = useState(currentFeedback || "");
  const [isEditing, setIsEditing] = useState(currentScore === null);

  if (!isEditing) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="text-xl font-black text-emerald-600">
            {currentScore} <span className="text-sm text-emerald-600/50">/ {maxPoints}</span>
          </div>
          {currentFeedback && <p className="text-xs text-[var(--color-muted)] italic">"{currentFeedback}"</p>}
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--color-muted)] transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form action={async (formData) => {
      setIsPending(true);
      try {
        formData.set("submissionId", submissionId);
        formData.set("assignmentId", assignmentId);
        formData.set("score", score.toString());
        formData.set("feedback", feedback);
        
        await gradeSubmissionAction(formData);
        setIsEditing(false);
      } finally {
        setIsPending(false);
      }
    }} className="space-y-3 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--color-line)]">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-[10px] font-black uppercase text-[var(--color-muted)] tracking-wider">Score</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={score} 
              onChange={e => setScore(e.target.value)}
              max={maxPoints}
              min={0}
              required
              className="w-20 input bg-[var(--surface-1)]"
            />
            <span className="text-sm font-bold text-[var(--color-muted)]">/ {maxPoints}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-[var(--color-muted)] tracking-wider">Feedback (Optional)</label>
        <textarea 
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          className="w-full input text-xs py-2 min-h-[60px] bg-[var(--surface-1)]"
          placeholder="Add comments for the student..."
        ></textarea>
      </div>
      <div className="flex justify-end gap-2">
        {currentScore !== null && (
          <button 
            type="button"
            onClick={() => {
              setIsEditing(false);
              setScore(currentScore);
              setFeedback(currentFeedback || "");
            }}
            className="text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)] px-3 py-1.5"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={isPending || score === ""}
          className="btn btn--primary py-1.5 px-4 rounded-lg text-xs flex items-center gap-2"
        >
          {isPending ? (
            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Check className="w-3 h-3" />
          )}
          <span>Save Grade</span>
        </button>
      </div>
    </form>
  );
}
