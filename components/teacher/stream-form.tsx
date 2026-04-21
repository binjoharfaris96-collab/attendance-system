"use client";

import { useState } from "react";
import { 
  MessageSquare, Send, Paperclip, Link as LinkIcon, FileUp, 
  Image as ImageIcon, Camera, Video, FileText, File as FileIcon, 
  Cloud, PlusCircle
} from "lucide-react";
import { createAnnouncementAction } from "@/app/actions/admin";

export function StreamForm({ buildingId }: { buildingId: string | null }) {
  const [isPending, setIsPending] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim() || !title.trim()) return;

    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("targetRole", "student"); // Default for classroom stream
    if (attachmentUrl) {
      formData.append("attachmentUrl", attachmentUrl);
      formData.append("attachmentName", attachmentName);
    }
    
    try {
      await createAnnouncementAction(formData);
      setContent("");
      setTitle("");
      setAttachmentUrl("");
      setAttachmentName("");
      setShowAdvanced(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  }

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
    <div className="card p-0 overflow-hidden border-2 border-transparent focus-within:border-[var(--color-accent)] transition-all bg-[var(--surface-1)]">
      <form onSubmit={handleSubmit}>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[var(--color-accent)]" />
             </div>
             <input 
               type="text" 
               placeholder="Announcement Title (e.g. Test Tomorrow)"
               className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-[var(--color-ink)] placeholder:text-[var(--color-muted)]"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               required
             />
          </div>
          
          <textarea
            placeholder="Announce something to your class..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] resize-none min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          {showAdvanced && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
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
                     <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase">{btn.label}</span>
                   </button>
                 ))}
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-tighter">
                  <Clock className="w-3 h-3" />
                  <span>Post Later (Scheduling)</span>
                </div>
                <input 
                  type="datetime-local" 
                  name="scheduledAt" 
                  className="w-full input text-xs bg-[var(--surface-2)] text-[var(--color-ink)]"
                />
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

        <div className="p-3 bg-[var(--surface-2)] flex items-center justify-between border-t border-[var(--color-line)]">
          <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-1)] transition-colors text-sm font-bold text-[var(--color-muted)]"
          >
            <Paperclip className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Options</span>
          </button>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !content.trim() || !title.trim()}
              className="btn btn--primary flex items-center gap-2 px-6 py-1.5 rounded-full text-xs"
            >
              {isPending ? (
                <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              <span>Post Now</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
