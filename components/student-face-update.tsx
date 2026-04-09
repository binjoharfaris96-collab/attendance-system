"use client";

import { useRef, useState } from "react";
import type * as faceapiType from "@vladmandic/face-api";
import { t, type AppLanguage } from "@/lib/i18n";

let faceapi: typeof faceapiType | null = null;

interface StudentFaceUpdateProps {
  studentId: string;
  hasFace: boolean;
  lang?: AppLanguage;
}

export function StudentFaceUpdate({ studentId, hasFace, lang = "en" }: StudentFaceUpdateProps) {
  const [captureMode, setCaptureMode] = useState<"camera" | "upload">("upload");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [photoSnapshot, setPhotoSnapshot] = useState<string | null>(null);
  const [faceMessage, setFaceMessage] = useState("");
  const [descriptors, setDescriptors] = useState<Float32Array[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [expanded, setExpanded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function loadModels() {
    if (modelsLoaded) return;
    setFaceMessage(t("student.loadingModels", lang));
    try {
      if (!faceapi) faceapi = await import("@vladmandic/face-api");
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/ml-models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/ml-models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/ml-models");
      setModelsLoaded(true);
      setFaceMessage("");
    } catch {
      setFaceMessage(t("student.loadingModels", lang));
    }
  }

  async function startCamera() {
    stopCamera();
    setUploadedImageSrc(null);
    setDescriptors([]);
    setFaceMessage(t("student.loadingModels", lang));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFaceMessage(t("student.loadingModels", lang));
    } catch {
      setFaceMessage(t("camera.cameraError", lang));
    }
  }

  function stopCamera() {
    setCapturing(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function captureSnapshot() {
    if (!videoRef.current || !faceapi || capturing) return;
    setCapturing(true);
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 });
    const detection = await faceapi
      .detectSingleFace(videoRef.current, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      // Capture first snapshot as profile photo
      if (descriptors.length === 0) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
        setPhotoSnapshot(canvas.toDataURL("image/jpeg", 0.7));
      }
      setDescriptors(prev => {
        const next = [...prev, detection.descriptor];
        if (next.length >= 5) {
          setFaceMessage(t("student.loadingModels", lang));
          stopCamera();
        } else {
          setFaceMessage(`${t("student.capture", lang)} ${next.length}/5`);
        }
        return next;
      });
    } else {
      setFaceMessage(t("student.loadingModels", lang));
    }
    setCapturing(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!modelsLoaded) await loadModels();
    const url = URL.createObjectURL(file);
    setUploadedImageSrc(url);
    setDescriptors([]);
    setFaceMessage(t("student.loadingModels", lang));
  }

  async function triggerImageAnalysis() {
    if (!imageRef.current || !faceapi) return;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 });
    const detection = await faceapi
      .detectSingleFace(imageRef.current, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      // Capture the uploaded image as profile photo via canvas
      const canvas = document.createElement("canvas");
      canvas.width = imageRef.current.naturalWidth;
      canvas.height = imageRef.current.naturalHeight;
      canvas.getContext("2d")?.drawImage(imageRef.current, 0, 0);
      setPhotoSnapshot(canvas.toDataURL("image/jpeg", 0.7));
      setDescriptors([detection.descriptor]);
      setFaceMessage(t("student.loadingModels", lang));
    } else {
      setDescriptors([]);
      setFaceMessage(t("student.loadingModels", lang));
    }
  }

  async function handleSave() {
    if (descriptors.length === 0) return;
    setStatus("saving");
    const descriptorsJson = JSON.stringify(descriptors.map(d => Array.from(d)));
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("faceDescriptors", descriptorsJson);
    if (photoSnapshot) formData.append("photoUrl", photoSnapshot);

    try {
      const res = await fetch("/api/students/face", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed");

      setStatus("success");
      setFaceMessage(t("student.loadingModels", lang));
      setDescriptors([]);
      setPhotoSnapshot(null);
      setUploadedImageSrc(null);
      setTimeout(() => {
        setStatus("idle");
        setExpanded(false);
        window.location.reload();
      }, 2000);
    } catch {
      setStatus("error");
      setFaceMessage(t("student.loadingModels", lang));
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            {t("student.faceRecognition", lang)}
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            {hasFace ? t("student.faceRegistered", lang) : t("student.noFaceData", lang)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFace && (
            <span className="badge badge--teal">{t("student.registered", lang)}</span>
          )}
          <button
            type="button"
            onClick={() => {
              setExpanded(v => {
                if (!v) {
                  loadModels();
                }
                return !v;
              });
            }}
            className="btn btn--outline text-sm"
          >
            {expanded ? t("student.cancel", lang) : hasFace ? t("student.updatePhoto", lang) : t("student.addPhoto", lang)}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-[var(--color-line)] pt-4">
          {/* Mode tabs */}
          <div className="flex gap-2 border-b border-[var(--color-line)] pb-2">
            <button
              type="button"
              onClick={() => { setCaptureMode("upload"); stopCamera(); setDescriptors([]); setFaceMessage(""); }}
              className={`text-sm font-medium pb-2 -mb-2.5 px-2 border-b-2 transition-all duration-200 ${
                captureMode === "upload"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-muted)] hover:-translate-y-[1px] hover:text-[var(--color-ink)]"
              }`}
            >
              {t("student.uploadPhoto", lang)}
            </button>
            <button
              type="button"
              onClick={() => { setCaptureMode("camera"); loadModels().then(startCamera); setDescriptors([]); setUploadedImageSrc(null); }}
              className={`text-sm font-medium pb-2 -mb-2.5 px-2 border-b-2 transition-all duration-200 ${
                captureMode === "camera"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-muted)] hover:-translate-y-[1px] hover:text-[var(--color-ink)]"
              }`}
            >
              {t("student.useWebcam", lang)}
            </button>
          </div>

          {captureMode === "upload" && (
            <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_72%,transparent)] text-center transition-colors hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,transparent)]">
              {uploadedImageSrc ? (
                <img
                  ref={imageRef}
                  src={uploadedImageSrc}
                  alt="Uploaded"
                  onLoad={triggerImageAnalysis}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="pointer-events-none p-6 text-[var(--color-muted)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2 h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <p className="text-sm font-medium">{t("student.clickUpload", lang)}</p>
                  <p className="text-xs">{t("student.jpegPng", lang)}</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          )}

          {captureMode === "camera" && (
            <div className="space-y-3">
              <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--surface-0)_86%,black)]">
                <video
                  ref={videoRef}
                  className={`absolute inset-0 h-full w-full object-cover ${descriptors.length >= 5 ? "opacity-30" : ""}`}
                  autoPlay
                  muted
                  playsInline
                />
                {!modelsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm text-white">
                    {t("student.loadingModels", lang)}
                  </div>
                )}
              </div>
              {descriptors.length < 5 && (
                <button
                  type="button"
                  onClick={captureSnapshot}
                  disabled={capturing || !modelsLoaded}
                  className="btn btn--primary w-full"
                >
                  {t("student.capture", lang)} ({descriptors.length}/5)
                </button>
              )}
            </div>
          )}

          {faceMessage && (
            <div className="rounded border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_84%,transparent)] px-3 py-2 text-center text-sm font-medium text-[var(--color-ink)]">
              {faceMessage}
            </div>
          )}

          {descriptors.length > 0 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={status === "saving"}
              className="btn btn--accent w-full"
            >
              {status === "saving" ? t("student.saving", lang) : t("student.saveFaceData", lang)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
