"use client";

import { createAssignment } from "@/app/actions/assignments";
import { CopyCheck, PlusCircle, Paperclip, Link as LinkIcon, FileUp, Image as ImageIcon, Camera, Video, FileText, File as FileIcon, Cloud, Clock } from "lucide-react";
import { useState } from "react";

export function AssignmentForm({ classes }: { classes: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const handleLink = (label: string) => {
    const url = window.prompt(`Enter the ${label} URL:`);
    if (url) {
      setAttachmentUrl(url);
      setAttachmentName(url.split("/").pop() || label);
    }
  };

  const handleCapture = (type: string, capture?: string) => {
    const input = document.createElement("input");
    input.type = "file";
    if (type) input.accept = type;
    if (capture) input.setAttribute("capture", capture);
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setAttachmentUrl("#simulated-upload"); 
        setAttachmentName(file.name);
      }
    };
    input.click();
  };

  const attachmentButtons = [
    { icon: <LinkIcon className="w-4 h-4" />, label: "Insert Link", color: "text-blue-500", onClick: () => handleLink("Link") },
    { icon: <FileUp className="w-4 h-4" />, label: "Upload File", color: "text-purple-500", onClick: () => handleCapture("") },
    { icon: <ImageIcon className="w-4 h-4" />, label: "Pick Photo", color: "text-emerald-500", onClick: () => handleCapture("image/*") },
    { icon: <Camera className="w-4 h-4" />, label: "Take Photo", color: "text-pink-500", onClick: () => handleCapture("image/*", "environment") },
    { icon: <Video className="w-4 h-4" />, label: "Record Video", color: "text-red-500", onClick: () => handleCapture("video/*", "environment") },
    { icon: <FileText className="w-4 h-4" />, label: "New PDF", color: "text-orange-500", onClick: () => handleCapture("application/pdf") },
    { icon: <FileIcon className="w-4 h-4" />, label: "New Docs", color: "text-indigo-500", onClick: () => handleLink("Google Doc") },
    { icon: <Cloud className="w-4 h-4" />, label: "Add from Drive", color: "text-sky-500", onClick: () => handleLink("Google Drive") },
  ];

  return (
    <div className="card p-6 shadow-xl border-t-4 border-t-[var(--color-accent)] animate-in slide-in-from-left duration-500">
      <div className="flex items-center space-x-2 mb-6">
        <PlusCircle className="w-5 h-5 text-[var(--color-accent)]" />
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Dispatch Task</h2>
      </div>

      {classes.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)] p-4 bg-[var(--surface-2)] rounded-lg text-center">
          You must be assigned to at least one class to create assignments.
        </div>
      ) : (
        <form action={async (formData) => {
          setIsPending(true);
          try { 
            await createAssignment(formData); 
            setAttachmentUrl("");
            setAttachmentName("");
          } finally { setIsPending(false); }
        }} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-ink)]">Target Class</label>
              <select name="classId" required className="w-full input bg-[var(--surface-1)] text-[var(--color-ink)]">
                <option value="">Select a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--color-ink)]">Assignment Title</label>
              <input 
                type="text" 
                name="title" 
                required 
                className="w-full input bg-[var(--surface-1)] text-[var(--color-ink)]" 
                placeholder="e.g. Chapter 4 Quiz"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-ink)]">Due Date</label>
                <input type="date" name="dueDate" required className="w-full input bg-[var(--surface-1)] text-[var(--color-ink)]" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-ink)]">Type</label>
                <select name="assignmentType" className="w-full input bg-[var(--surface-1)] text-[var(--color-ink)]">
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="question">Question</option>
                  <option value="material">Material</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[var(--color-ink)]">Points</label>
                <input type="number" name="points" defaultValue={100} className="w-full input bg-[var(--surface-1)] text-[var(--color-ink)]" min={0} />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-[var(--color-ink)]">Topic</label>
              <input 
                type="text" 
                name="topic" 
                className="w-full input bg-[var(--surface-1)] text-[var(--color-ink)]" 
                placeholder="e.g. Science Revision"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-ink)]">Description / Instructions</label>
            <textarea 
              name="description" 
              className="w-full input min-h-[120px] py-3 bg-[var(--surface-1)] text-[var(--color-ink)]" 
              placeholder="Provide details about the assignment..."
            ></textarea>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-[var(--color-accent)] hover:underline"
            >
              <Paperclip className="w-3 h-3" />
              {showAdvanced ? "Hide Attachments" : "Add Attachments"}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95">
                {attachmentUrl && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                     <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600 truncate max-w-[200px]">{attachmentName}</span>
                     </div>
                     <button 
                       type="button" 
                       onClick={() => { setAttachmentUrl(""); setAttachmentName(""); }}
                       className="text-[10px] font-bold text-red-500 hover:underline"
                     >
                       Remove
                     </button>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {attachmentButtons.map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={btn.onClick}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--color-line)] transition-all text-left"
                    >
                      <span className={btn.color}>{btn.icon}</span>
                      <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {attachmentUrl && (
            <>
              <input type="hidden" name="attachmentUrl" value={attachmentUrl} />
              <input type="hidden" name="attachmentName" value={attachmentName} />
            </>
          )}

          {/* Scheduling Section */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
              <Clock className="w-3 h-3" />
              <span>Scheduling (Optional)</span>
            </div>
            <input 
              type="datetime-local" 
              name="scheduledAt" 
              className="w-full input text-xs bg-[var(--surface-1)] text-[var(--color-ink)]"
            />
            <p className="text-[10px] text-[var(--color-muted)]">If set, this task will only appear to students after this time.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 btn btn--primary py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
            >
              {isPending ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CopyCheck className="w-5 h-5" />
                  <span>Post Now</span>
                </>
              )}
            </button>
            
            <button
              type="submit"
              disabled={isPending}
              className="px-6 btn btn--secondary py-3 rounded-xl font-bold text-xs"
            >
              Schedule
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
