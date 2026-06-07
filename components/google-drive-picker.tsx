"use client";

import { useState } from "react";
import { Folder, FileText, BarChart2, Presentation, Link as LinkIcon, X, AlertCircle } from "lucide-react";
import { t, type AppLanguage } from "@/lib/i18n";

type GoogleLinkType = "doc" | "sheet" | "slide" | "generic" | null;

interface GoogleDrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, name: string) => void;
  lang: AppLanguage;
}

export function GoogleDrivePicker({ isOpen, onClose, onSelect, lang }: GoogleDrivePickerProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<GoogleLinkType>(null);

  if (!isOpen) return null;

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setError(null);

    if (!val) {
      setDetectedType(null);
      return;
    }

    // Auto-detect type
    if (val.includes("docs.google.com/document")) {
      setDetectedType("doc");
    } else if (val.includes("docs.google.com/spreadsheets")) {
      setDetectedType("sheet");
    } else if (val.includes("docs.google.com/presentation")) {
      setDetectedType("slide");
    } else if (val.includes("drive.google.com")) {
      setDetectedType("generic");
    } else {
      setDetectedType(null);
    }
  };

  const handleAdd = () => {
    if (!url) {
      setError(t("submissions.invalidLink", lang));
      return;
    }

    const isGoogle = url.includes("drive.google.com") || url.includes("docs.google.com");
    if (!isGoogle) {
      setError(t("submissions.invalidLink", lang));
      return;
    }

    let resolvedName = name.trim();
    if (!resolvedName) {
      if (detectedType === "doc") resolvedName = "Google Doc File";
      else if (detectedType === "sheet") resolvedName = "Google Sheet File";
      else if (detectedType === "slide") resolvedName = "Google Slides Presentation";
      else resolvedName = "Google Drive Attachment";
    }

    onSelect(url.trim(), resolvedName);
    setUrl("");
    setName("");
    setDetectedType(null);
    onClose();
  };

  const renderIcon = () => {
    switch (detectedType) {
      case "doc":
        return <FileText className="w-10 h-10 text-blue-500" />;
      case "sheet":
        return <BarChart2 className="w-10 h-10 text-emerald-500" />;
      case "slide":
        return <Presentation className="w-10 h-10 text-amber-500" />;
      case "generic":
        return <Folder className="w-10 h-10 text-indigo-500" />;
      default:
        return <LinkIcon className="w-10 h-10 text-[var(--color-accent)]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="card w-full max-w-md p-6 relative flex flex-col space-y-4 border border-[var(--glass-border)] bg-[var(--color-panel)] shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--surface-2)] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="p-3 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-ink)]">{t("submissions.googleDrive", lang)}</h3>
            <p className="text-xs text-[var(--color-muted)]">{t("submissions.pasteGoogleLink", lang)}</p>
          </div>
        </div>

        {/* Link Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-muted)]">
            URL
          </label>
          <input 
            type="url"
            className="input w-full"
            placeholder="https://docs.google.com/..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
        </div>

        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-muted)]">
            {t("submissions.documentName", lang)}
          </label>
          <input 
            type="text"
            className="input w-full"
            placeholder={
              detectedType === "doc" ? "Biology Report" : 
              detectedType === "sheet" ? "Form Responses" : 
              detectedType === "slide" ? "History Lecture" : 
              "My Document"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-red-light)] border border-red-500/20 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn--outline rounded-xl text-xs py-2 px-4"
          >
            {t("student.cancel", lang)}
          </button>
          <button 
            type="button" 
            onClick={handleAdd}
            className="btn btn--primary rounded-xl text-xs py-2 px-4"
          >
            {t("apps.addApp", lang)}
          </button>
        </div>

      </div>
    </div>
  );
}
