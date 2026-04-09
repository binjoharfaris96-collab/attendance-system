"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type * as faceapiType from "@vladmandic/face-api";

let faceapi: typeof faceapiType | null = null;

import { createStudentAction } from "@/app/actions/students";
import { SubmitButton } from "@/components/submit-button";
import { t, type AppLanguage } from "@/lib/i18n";
import { idleActionState } from "@/lib/types";

const VIDEO_CAPTURE_DURATION_MS = 6000;
const VIDEO_CAPTURE_INTERVAL_MS = 300;
const VIDEO_CAPTURE_MIN_SAMPLES = 3;
const VIDEO_CAPTURE_MAX_SAMPLES = 8;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function StudentAddModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [captureMode, setCaptureMode] = useState<"camera" | "upload">("camera");
  const [activeLang, setActiveLang] = useState<AppLanguage>("en");
  const formRef = useRef<HTMLFormElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureSessionRef = useRef(0);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [photoSnapshot, setPhotoSnapshot] = useState<string | null>(null);
  const [descriptors, setDescriptors] = useState<Float32Array[]>([]);
  const [faceMessage, setFaceMessage] = useState("");

  const [state, action] = useActionState(createStudentAction, idleActionState);

  useEffect(() => {
    const updateLangFromHtml = () => {
      const htmlLang = document.documentElement.lang === "ar" ? "ar" : "en";
      setActiveLang(htmlLang);
    };

    updateLangFromHtml();

    const observer = new MutationObserver(updateLangFromHtml);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);

  const stopCamera = useCallback(() => {
    captureSessionRef.current += 1;
    setCapturing(false);
    setVideoProgress(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const closeModal = useCallback(() => {
    stopCamera();
    formRef.current?.reset();
    setStep(1);
    setCaptureMode("camera");
    setDescriptors([]);
    setPhotoSnapshot(null);
    setUploadedImageSrc(null);
    setFaceMessage("");
    setOpen(false);
  }, [stopCamera]);

  useEffect(() => {
    if (state.status === "success") {
      closeModal();
    }
  }, [state.status, closeModal]);

  async function loadModels() {
    if (modelsLoaded) return;
    try {
      if (!faceapi) {
        faceapi = await import("@vladmandic/face-api");
      }
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/ml-models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/ml-models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/ml-models");
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load models:", err);
      setFaceMessage(t("student.modelsLoadFailed", activeLang));
    }
  }

  async function startCamera() {
    stopCamera();
    setUploadedImageSrc(null);
    setDescriptors([]);
    setPhotoSnapshot(null);
    setVideoProgress(0);
    setFaceMessage(t("student.startingCamera", activeLang));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFaceMessage(t("student.cameraReadyVideo", activeLang));
    } catch (err) {
      console.error(err);
      setFaceMessage(t("student.cameraError", activeLang));
    }
  }

  const captureVideoSamples = useCallback(async () => {
    if (!videoRef.current || !streamRef.current || !faceapi || capturing) return;

    const session = captureSessionRef.current + 1;
    captureSessionRef.current = session;
    setCapturing(true);
    setDescriptors([]);
    setPhotoSnapshot(null);
    setVideoProgress(0);
    setFaceMessage(t("student.recordingPrompt", activeLang));

    const collected: Float32Array[] = [];
    let capturedPhoto = false;
    const startedAt = performance.now();
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 });

    try {
      while (performance.now() - startedAt < VIDEO_CAPTURE_DURATION_MS) {
        if (captureSessionRef.current !== session || !videoRef.current || !streamRef.current || !faceapi) {
          return;
        }

        const detection = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          collected.push(detection.descriptor);
          if (!capturedPhoto && videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
            setPhotoSnapshot(canvas.toDataURL("image/jpeg", 0.7));
            capturedPhoto = true;
          }
        }

        if (collected.length >= VIDEO_CAPTURE_MAX_SAMPLES) {
          break;
        }

        const progress = Math.min(
          100,
          Math.round(((performance.now() - startedAt) / VIDEO_CAPTURE_DURATION_MS) * 100),
        );
        setVideoProgress(progress);
        await wait(VIDEO_CAPTURE_INTERVAL_MS);
      }

      if (captureSessionRef.current !== session) {
        return;
      }

      setVideoProgress(100);
      setDescriptors(collected.slice(0, VIDEO_CAPTURE_MAX_SAMPLES));

      if (collected.length >= VIDEO_CAPTURE_MIN_SAMPLES) {
        setFaceMessage(`${t("student.videoCaptureComplete", activeLang)} (${collected.length})`);
        stopCamera();
      } else if (collected.length > 0) {
        setFaceMessage(`${t("student.videoCaptureFewSamples", activeLang)} (${collected.length})`);
      } else {
        setFaceMessage(t("student.noFaceDuringVideo", activeLang));
      }
    } catch (err) {
      console.error(err);
      setFaceMessage(t("student.videoCaptureFailed", activeLang));
    }

    if (captureSessionRef.current === session) {
      setCapturing(false);
    }
  }, [activeLang, capturing, stopCamera]);

  // Handle Enter key to start video capture when in step 2 camera
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (open && step === 2 && captureMode === "camera" && e.key === "Enter") {
        e.preventDefault();
        captureVideoSamples();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, step, captureMode, capturing, captureVideoSamples]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!modelsLoaded) {
      setFaceMessage(t("student.loadingModels", activeLang));
      await loadModels();
    }

    const url = URL.createObjectURL(file);
    setUploadedImageSrc(url);
    setFaceMessage(t("student.analyzingPhoto", activeLang));
    setDescriptors([]);
  }

  // Trigger face detection automatically if image successfully mounts
  async function triggerImageAnalysis() {
    if (!imageRef.current || !faceapi) return;
    
    try {
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 });
      const detection = await faceapi
        .detectSingleFace(imageRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detection) {
        // Save uploaded image as profile photo
        const canvas = document.createElement("canvas");
        canvas.width = imageRef.current.naturalWidth;
        canvas.height = imageRef.current.naturalHeight;
        canvas.getContext("2d")?.drawImage(imageRef.current, 0, 0);
        setPhotoSnapshot(canvas.toDataURL("image/jpeg", 0.7));
        setDescriptors([detection.descriptor]);
        setFaceMessage(t("student.validFaceDetected", activeLang));
      } else {
        setDescriptors([]);
        setFaceMessage(t("student.noFaceInPhoto", activeLang));
      }
    } catch (err) {
      console.error(err);
      setFaceMessage(t("student.imageProcessingError", activeLang));
    }
  }

  function handleNext(e: React.MouseEvent) {
    e.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    setStep(2);
    
    // Load models and start camera
    loadModels().then(startCamera);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn--primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        {t("student.addStudent", activeLang)}
      </button>
    );
  }

  // Convert Float32Arrays to basic arrays for JSON serialization
  const descriptorsJson = JSON.stringify(
    descriptors.map(d => Array.from(d))
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn--primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        {t("student.addStudent", activeLang)}
      </button>

      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal-content modal-skin" onClick={(e) => e.stopPropagation()}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {step === 1 ? t("student.step1", activeLang) : t("student.step2", activeLang)}
            </h2>
            <button
              onClick={closeModal}
              className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form ref={formRef} action={action} className="space-y-4">
            
            {/* Step 1: Details */}
            <div className={step === 1 ? "block" : "hidden"}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="field-label" htmlFor="studentCode">{t("student.studentId", activeLang)}</label>
                  <input id="studentCode" name="studentCode" className="field-input" placeholder={t("student.studentIdPlaceholder", activeLang)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="field-label" htmlFor="fullName">{t("student.fullName", activeLang)}</label>
                  <input id="fullName" name="fullName" className="field-input" placeholder={t("student.fullNamePlaceholder", activeLang)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="field-label" htmlFor="className">{t("student.classOrGroup", activeLang)}</label>
                  <input id="className" name="className" className="field-input" placeholder={t("student.classPlaceholder", activeLang)} />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="btn btn--outline">{t("student.cancel", activeLang)}</button>
                <button type="button" onClick={handleNext} className="btn btn--primary">{t("student.nextStep", activeLang)} {"->"}</button>
              </div>
            </div>

            {/* Step 2: Face Capture */}
            <div className={step === 2 ? "block" : "hidden"}>
              
              <div className="mb-4 flex gap-2 border-b border-[var(--color-line)] pb-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setCaptureMode("camera");
                    startCamera();
                  }}
                  className={`text-sm font-medium pb-2 -mb-2.5 px-2 border-b-2 transition-all duration-200 ${
                    captureMode === "camera"
                      ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "border-transparent text-[var(--color-muted)] hover:-translate-y-[1px] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {t("student.useWebcam", activeLang)}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setCaptureMode("upload");
                    stopCamera();
                    setFaceMessage(t("student.selectImageFile", activeLang));
                    setDescriptors([]);
                  }}
                  className={`text-sm font-medium pb-2 -mb-2.5 px-2 border-b-2 transition-all duration-200 ${
                    captureMode === "upload"
                      ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "border-transparent text-[var(--color-muted)] hover:-translate-y-[1px] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {t("student.uploadPhoto", activeLang)}
                </button>
              </div>

              {captureMode === "camera" && (
                <div className="space-y-4">
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--surface-0)_86%,black)] shadow-inner">
                    <video
                      ref={videoRef}
                      width={400}
                      height={300}
                      className={`absolute inset-0 h-full w-full object-cover ${descriptors.length >= VIDEO_CAPTURE_MIN_SAMPLES ? "opacity-30" : ""}`}
                      autoPlay
                      muted
                      playsInline
                    />
                    {capturing && (
                      <div className="absolute bottom-3 left-3 right-3 rounded bg-black/60 px-3 py-2 text-xs font-semibold text-white">
                        {t("student.recording", activeLang)} {videoProgress}%
                      </div>
                    )}
                    {!modelsLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm text-white">
                        {t("student.loadingModels", activeLang)}
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={captureVideoSamples}
                    disabled={capturing || !modelsLoaded}
                    className="btn btn--primary w-full flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="15" height="12" rx="2" ry="2"/><path d="m22 8-5 4 5 4V8z"/></svg>
                    {capturing
                      ? t("student.recording", activeLang)
                      : descriptors.length >= VIDEO_CAPTURE_MIN_SAMPLES
                        ? t("student.recordAgainVideo", activeLang)
                        : t("student.recordVideoEnter", activeLang)}
                  </button>
                </div>
              )}

              {captureMode === "upload" && (
                <div className="space-y-4">
                  <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[var(--color-line)] bg-[var(--color-panel)] text-center transition-colors hover:bg-[color-mix(in_oklab,var(--color-panel)_85%,var(--color-canvas))]">
                    {uploadedImageSrc ? (
                      <img 
                        ref={imageRef} 
                        src={uploadedImageSrc} 
                        alt={t("student.uploadedImage", activeLang)} 
                        onLoad={triggerImageAnalysis}
                        className="absolute inset-0 h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="pointer-events-none p-6 text-[var(--color-muted)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2 h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        <p className="text-sm font-medium">{t("student.clickUpload", activeLang)}</p>
                        <p className="text-xs">{t("student.jpegPng", activeLang)}</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className={`absolute inset-0 z-10 w-full h-full cursor-pointer ${uploadedImageSrc ? 'opacity-0' : 'opacity-0'}`}
                      title=""
                    />
                  </div>
                </div>
              )}

              {faceMessage && (
                <div className="mt-3 rounded border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2 text-center text-sm font-medium text-[var(--color-ink)]">
                  {faceMessage}
                </div>
              )}

              {/* Hidden fields storing data */}
              <input type="hidden" name="faceDescriptors" value={descriptorsJson} />
              {photoSnapshot && (
                <input type="hidden" name="photoUrl" value={photoSnapshot} />
              )}

              <div className="flex gap-3">
                <SubmitButton
                  label={t("student.finish", activeLang)}
                  pendingLabel={t("student.saving", activeLang)}
                  className="btn btn--primary flex-1"
                  disabled={descriptors.length === 0 || (captureMode === "camera" && descriptors.length < VIDEO_CAPTURE_MIN_SAMPLES)}
                />
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setStep(1);
                  }}
                  className="btn btn--outline"
                >
                  {t("student.back", activeLang)}
                </button>
              </div>
            </div>

            {state.message && (
              <p className={`form-message mt-4 form-message--${state.status}`}>
                {state.message}
              </p>
            )}

          </form>
        </div>
      </div>
    </>
  );
}
