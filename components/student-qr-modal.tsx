"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Copy, Check, Download, ExternalLink } from "lucide-react";

export function StudentQRModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const registerUrl = `${origin}/register/student`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById("registration-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "student-registration-qr.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn flex items-center gap-2 px-6 h-12 rounded-2xl bg-[var(--surface-1)] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--surface-2)] font-bold transition-all active:scale-95"
      >
        <QrCode className="w-5 h-5 text-blue-500" />
        Registration QR
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/20">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[var(--surface-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
              <QrCode className="w-8 h-8" />
           </div>
           <h2 className="text-xl font-black text-[var(--color-ink)] tracking-tight">Student Self-Registration</h2>
           <p className="text-sm text-[var(--color-muted)] mt-1 font-medium">Download or display this QR for students to join.</p>
        </div>

        <div className="flex flex-col items-center gap-8 py-4">
          <div className="p-6 bg-white rounded-[2rem] shadow-inner-xl border-4 border-white/50">
            <QRCodeSVG 
              id="registration-qr-code"
              value={registerUrl} 
              size={220}
              level="H"
              includeMargin={false}
              className="rounded-xl"
            />
          </div>

          <div className="w-full space-y-3">
             <div className="flex items-center gap-2 p-3 bg-[var(--surface-1)] border border-[var(--color-line)] rounded-2xl">
                <div className="flex-1 overflow-hidden">
                   <p className="text-[10px] lowercase text-[var(--color-muted)] truncate px-1">{registerUrl}</p>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[var(--color-muted)]" />}
                </button>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={downloadQR}
                 className="btn h-12 rounded-2xl bg-[var(--surface-1)] border border-[var(--color-line)] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[var(--surface-2)]"
               >
                 <Download className="w-4 h-4" />
                 Download
               </button>
               <a 
                 href={registerUrl}
                 target="_blank"
                 className="btn h-12 rounded-2xl bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 shadow-lg shadow-blue-500/20"
               >
                 <ExternalLink className="w-4 h-4" />
                 Open Link
               </a>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-line)] text-center">
            <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest leading-relaxed">
              Scan with any mobile camera<br/>to access the registration portal
            </p>
        </div>
      </div>
    </div>
  );
}
