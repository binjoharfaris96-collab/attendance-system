"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Video, X, Loader2, StopCircle } from "lucide-react";

type WebcamCaptureProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, type: "photo" | "video") => void;
  mode: "photo" | "video";
};

export function WebcamCapture({ isOpen, onClose, onCapture, mode }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);

  // Start webcam
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    setIsReady(false);
    setRecordedChunks([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: mode === "video",
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsReady(true);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Could not access your camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw current frame
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob, "photo");
        onClose();
      }
    }, "image/jpeg", 0.9);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setRecordedChunks((prev) => [...prev, e.data]);
      }
    };
    
    recorder.onstop = () => {
      // The state update in ondataavailable might be slightly delayed, 
      // so we use a setTimeout or rely on the chunks array when we process it.
    };
    
    setRecordedChunks([]);
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // When recordedChunks updates and we aren't recording, we have our video
  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0 && mediaRecorderRef.current?.state === "inactive") {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      onCapture(blob, "video");
      onClose();
    }
  }, [recordedChunks, isRecording, onCapture, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--surface-1)] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-[var(--color-line)]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-line)]">
          <h3 className="font-bold text-[var(--color-ink)] flex items-center gap-2">
            {mode === "photo" ? <Camera className="w-5 h-5 text-pink-500" /> : <Video className="w-5 h-5 text-red-500" />}
            {mode === "photo" ? "Take a Photo" : "Record Video"}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-muted)]" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-red-400 font-medium mb-4">{error}</p>
              <button onClick={startCamera} className="btn btn-outline border-white/20 text-white hover:bg-white/10">Try Again</button>
            </div>
          ) : !isReady ? (
            <div className="flex flex-col items-center gap-4 text-white/50">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium animate-pulse">Initializing camera...</p>
            </div>
          ) : null}
          
          <video 
            ref={videoRef}
            className={`w-full h-full object-cover ${!isReady || error ? "hidden" : "block"} ${mode === "photo" ? "scale-x-[-1]" : ""}`}
            playsInline
            muted={mode === "photo"} // mute if photo
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wider">REC</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-[var(--surface-2)] flex items-center justify-center border-t border-[var(--color-line)]">
          {isReady && !error && (
            <>
              {mode === "photo" ? (
                <button 
                  onClick={takePhoto}
                  className="group relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-pink-500/30 hover:border-pink-500/50 transition-all"
                >
                  <div className="w-12 h-12 bg-pink-500 rounded-full group-hover:scale-95 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.4)]" />
                </button>
              ) : (
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`group relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all ${isRecording ? "border-white/20" : "border-red-500/30 hover:border-red-500/50"}`}
                >
                  {isRecording ? (
                    <div className="w-8 h-8 bg-red-500 rounded-sm hover:scale-95 transition-transform" />
                  ) : (
                    <div className="w-12 h-12 bg-red-500 rounded-full group-hover:scale-95 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                  )}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
