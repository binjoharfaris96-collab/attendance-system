"use client";

import { submitAssignmentAction } from "@/app/actions/assignments";
import { useState } from "react";
import { Send, Link as LinkIcon, Cloud, FileUp, Paperclip } from "lucide-react";
import { GoogleDrivePicker } from "@/components/google-drive-picker";

export function SubmissionForm({ assignmentId }: { assignmentId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  const handleCapture = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setAttachmentUrl("#simulated-upload"); 
        setAttachmentName(file.name);
      }
    };
    input.click();
  };

  const handleLink = () => {
    const url = window.prompt("Enter the URL:");
    if (url) {
      setAttachmentUrl(url);
      setAttachmentName(url.split("/").pop() || "Link");
    }
  };

  return (
    <form action={async (formData) => {
      setIsPending(true);
      try {
        formData.set("assignmentId", assignmentId);
        formData.set("content", content);
        if (attachmentUrl) formData.set("fileUrl", attachmentUrl);
        if (attachmentName) formData.set("attachmentName", attachmentName);
        
        await submitAssignmentAction(formData);
      } finally {
        setIsPending(false);
      }
    }} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Your Response / Private Comment
        </label>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full input min-h-[120px] py-3 bg-[var(--surface-2)] text-[var(--color-ink)]" 
          placeholder="Type your answer or provide details..."
        ></textarea>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Attachments
        </label>
        
        {attachmentUrl ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
             <div className="flex items-center gap-3">
                <Paperclip className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-bold text-blue-600 truncate max-w-[200px]">{attachmentName}</span>
             </div>
             <button 
               type="button" 
               onClick={() => { setAttachmentUrl(""); setAttachmentName(""); }}
               className="text-xs font-bold text-red-500 hover:underline px-2 py-1"
             >
               Remove
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCapture}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--color-line)] transition-all"
            >
              <FileUp className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-[var(--color-ink)]">Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDrivePickerOpen(true)}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--color-line)] transition-all"
            >
              <Cloud className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-bold text-[var(--color-ink)]">Google Drive</span>
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--color-line)] transition-all"
            >
              <LinkIcon className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-[var(--color-ink)]">Add Link</span>
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || (!content && !attachmentUrl)}
        className="w-full btn btn--primary py-3 rounded-xl font-bold flex items-center justify-center space-x-2 mt-4"
      >
        {isPending ? (
          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Turn In Assignment</span>
          </>
        )}
      </button>

      <GoogleDrivePicker 
        isOpen={isDrivePickerOpen} 
        onClose={() => setIsDrivePickerOpen(false)} 
        onSelect={(url, name) => {
          setAttachmentUrl(url);
          setAttachmentName(name);
        }} 
        lang="en" 
      />
    </form>
  );
}
