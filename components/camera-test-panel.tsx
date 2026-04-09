"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as faceapiType from "@vladmandic/face-api";
import { t, type AppLanguage } from "@/lib/i18n";

let faceapi: typeof faceapiType | null = null;

import { checkInRecognizedFace } from "@/app/actions/recognition";

type RegisteredStudent = {
  studentCode: string;
  fullName: string;
  className: string;
  attendanceCount: number;
  latesCount: number;
  createdAt: string;
  faceDescriptors: number[][];
};

type CameraStatus = "initializing" | "ready" | "error" | "stopped";

export function CameraTestPanel({
  registeredStudents,
  enableUnknownFaceAlerts = true,
  lang = "en",
}: {
  registeredStudents: RegisteredStudent[];
  enableUnknownFaceAlerts?: boolean;
  lang?: AppLanguage;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMatcherRef = useRef<faceapiType.FaceMatcher | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<CameraStatus>("stopped");
  const [activeLang, setActiveLang] = useState<AppLanguage>(lang);
  const [message, setMessage] = useState(
    `${t("camera.startScanner", lang)} (${registeredStudents.length} ${t("camera.registeredFaces", lang)})`,
  );
  const [matchedStudent, setMatchedStudent] = useState<RegisteredStudent | null>(null);
  
  // Cooldown map to prevent spamming check-ins
  const recentCheckIns = useRef<Record<string, number>>({});
  // Cooldown for unknown faces
  const lastUnknownLogParams = useRef<{ time: number }>({ time: 0 });
  // Ref to track how long an unknown face has been continuously detected
  const unknownStartRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    setStatus("stopped");
    setMessage(
      `${t("camera.startScanner", activeLang)} (${registeredStudents.length} ${t("camera.registeredFaces", activeLang)})`,
    );
    setMatchedStudent(null);
    unknownStartRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [activeLang, registeredStudents.length]);

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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  async function loadModelsAndMatcher() {
    setStatus("initializing");
    setMessage(t("student.loadingModels", activeLang));
    try {
      if (!faceapi) {
        faceapi = await import("@vladmandic/face-api");
      }
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/ml-models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/ml-models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/ml-models");

      setMessage(t("camera.registeredFaces", activeLang));
      const labeledDescriptors = registeredStudents.map((student) => {
        const float32Arrays = student.faceDescriptors.map((arr) => new Float32Array(arr));
        return new faceapi!.LabeledFaceDescriptors(student.studentCode, float32Arrays);
      });

      if (labeledDescriptors.length > 0) {
        faceMatcherRef.current = new faceapi!.FaceMatcher(labeledDescriptors, 0.65); // More forgiving standard threshold
        setMessage(t("camera.startScanner", activeLang));
      } else {
        setMessage(t("camera.noFaceProfiles", activeLang));
        setStatus("error");
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      setMessage(t("student.modelsLoadFailed", activeLang));
      setStatus("error");
      return false;
    }
  }

  async function runScannerLoop() {
    if (!videoRef.current || !streamRef.current || !faceapi) return;
    
    if (videoRef.current.readyState >= 2 && canvasRef.current) {
      const options = new faceapi!.SsdMobilenetv1Options({ minConfidence: 0.4 });
      const detection = await faceapi!
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!videoRef.current || !canvasRef.current) return; // Exit safely if component unmounted or stopped during scan

      if (detection) {
        const displaySize = { 
          width: videoRef.current.width || videoRef.current.videoWidth, 
          height: videoRef.current.height || videoRef.current.videoHeight 
        };
        faceapi!.matchDimensions(canvasRef.current, displaySize);
        const resizedDetection = faceapi!.resizeResults(detection, displaySize);

        let boxLabel = t("camera.unknown", activeLang);

        if (faceMatcherRef.current) {
          const bestMatch = faceMatcherRef.current.findBestMatch(detection.descriptor);
          
          if (bestMatch.label !== "unknown") {
            unknownStartRef.current = null;
            const studentCode = bestMatch.label;
            const student = registeredStudents.find(s => s.studentCode === studentCode);
            
            if (student) {
              handleMatch(studentCode, student);
              boxLabel = `${student.fullName} (${studentCode})`;
            }
          } else {
            const now = Date.now();
            if (unknownStartRef.current === null) {
              unknownStartRef.current = now;
            }

            const timeSinceUnknown = now - unknownStartRef.current;
            if (!enableUnknownFaceAlerts) {
              setMessage(t("camera.unknownDetectedMonitoring", activeLang));
              setMatchedStudent(null);
            } else if (timeSinceUnknown < 1500) {
              setMessage(`${t("camera.unknownCapturingPrefix", activeLang)} ${((1500 - timeSinceUnknown) / 1000).toFixed(1)}s...`);
              setMatchedStudent(null);
            } else {
              setMessage(`${t("camera.unknownCapturedLogged", activeLang)} (${bestMatch.distance.toFixed(2)})`);
              setMatchedStudent(null);

              // Handle snapshot capture and logging
              if (now - lastUnknownLogParams.current.time > 10000) {
                lastUnknownLogParams.current.time = now;

                const offCanvas = document.createElement("canvas");
                const ctx = offCanvas.getContext("2d");
                if (ctx && videoRef.current) {
                  // Capture the full unbounded photo of the entire camera frame
                  offCanvas.width = videoRef.current.videoWidth;
                  offCanvas.height = videoRef.current.videoHeight;

                  try {
                    ctx.drawImage(videoRef.current, 0, 0, offCanvas.width, offCanvas.height);
                    import("@/app/actions/recognition").then(actions => {
                      actions.logUnknownFaceAction(offCanvas.toDataURL("image/jpeg", 0.7));
                    });
                  } catch (err) {
                    console.error("Capture warning face error:", err);
                  }
                }
              }
            }
          }
        }

        const drawBox = new faceapi!.draw.DrawBox(resizedDetection.detection.box, { label: boxLabel });
        drawBox.draw(canvasRef.current);
      } else {
        unknownStartRef.current = null;
        setMessage(t("checkin.searchingFace", activeLang));
        setMatchedStudent(null);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    if (streamRef.current) {
      scanTimeoutRef.current = setTimeout(() => {
        void runScannerLoop();
      }, 800);
    }
  }

  async function handleMatch(studentCode: string, student: RegisteredStudent) {
    const now = Date.now();
    const lastCheckin = recentCheckIns.current[studentCode];
    
    setMatchedStudent(student);

    // 5-second local debounce for visual feedback
    if (lastCheckin && now - lastCheckin < 5000) {
      setMessage(`${student.fullName}: ${t("checkin.recentlyProcessed", activeLang)}`);
      return;
    }
    
    recentCheckIns.current[studentCode] = now;
    setMessage(`${student.fullName} - ${t("camera.recognizedCheckingIn", activeLang)}`);

    const result = await checkInRecognizedFace(studentCode);
    if (result.status === "created") {
      let msg = `${student.fullName}: ${t("checkin.presentSuccess", activeLang)}`;
      if (result.latesCount !== undefined && result.latesCount > 0) {
        msg += ` (${t("checkin.latesTotal", activeLang)}: ${result.latesCount})`;
      }
      setMessage(msg);
      // Optimistically update attendance count and lates count for the preview
      setMatchedStudent({ 
        ...student, 
        attendanceCount: student.attendanceCount + 1,
        latesCount: result.latesCount ?? student.latesCount
      });
    } else if (result.status === "duplicate") {
      setMessage(`${student.fullName}: ${t("checkin.alreadyCheckedIn", activeLang)}`);
    } else if (result.status === "rejected") {
      setMessage(t("checkin.outsideWindow", activeLang));
    } else {
      setMessage(t("checkin.checkInFailed", activeLang));
    }
  }

  function calculateAbsentDays(createdAt: string, presentCount: number) {
    const start = new Date(createdAt);
    const now = new Date();
    // Count weekdays
    let weekdays = 0;
    const cur = new Date(start);
    while(cur <= now) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) weekdays++;
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(0, weekdays - presentCount);
  }

  async function startScanner() {
    const ready = await loadModelsAndMatcher();
    if (!ready) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("ready");
      runScannerLoop();
    } catch {
      setStatus("error");
      setMessage(t("camera.permissionDenied", activeLang));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Camera viewport */}
      <div className="card card--no-pad overflow-hidden">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-[color-mix(in_srgb,var(--surface-0)_86%,black)]">
          <video
            ref={videoRef}
            width={640}
            height={480}
            className={`absolute inset-0 h-full w-full object-cover ${
              status === "ready" ? "block" : "hidden"
            }`}
            autoPlay
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 z-10 h-full w-full object-cover ${
              status === "ready" ? "block" : "hidden"
            }`}
          />

          {status !== "ready" && (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <button 
                onClick={startScanner} 
                className="btn btn--accent"
                disabled={status === "initializing"}
              >
                {status === "initializing" ? t("camera.loading", activeLang) : t("camera.startScanner", activeLang)}
              </button>
            </div>
          )}

          {status === "ready" && (
            <button
              type="button"
              onClick={stopCamera}
              className="btn btn--outline absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-sm shadow-md"
            >
              {t("camera.stopScanner", activeLang)}
            </button>
          )}
        </div>
      </div>

      {/* Detection result */}
      <div className="card flex flex-col">
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">
          {t("camera.detectionResult", activeLang)}
        </h2>

        <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          
          {matchedStudent ? (
            <div className="w-full flex-1 animate-in fade-in zoom-in-95 duration-200">
              <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] shadow-sm">
                <div className="bg-[color-mix(in_oklab,var(--color-accent-light)_45%,var(--color-panel))] p-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-2)_82%,transparent)] text-2xl font-bold text-[var(--color-ink)]">
                    {matchedStudent.fullName.charAt(0)}
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[var(--color-ink)]">{matchedStudent.fullName}</h3>
                  <p className="text-sm font-medium text-[var(--color-accent)]">{matchedStudent.studentCode}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{matchedStudent.className}</p>
                </div>
                
                <div className="grid grid-cols-3 divide-x divide-[var(--color-line)] border-t border-[var(--color-line)] bg-[var(--color-panel)] p-4">
                  <div className="flex flex-col text-center">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">{t("camera.present", activeLang)}</span>
                    <span className="mt-1 text-2xl font-bold text-[color-mix(in_srgb,var(--color-green)_82%,white)]">{matchedStudent.attendanceCount}</span>
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">{t("camera.absent", activeLang)}</span>
                    <span className="mt-1 text-2xl font-bold text-[color-mix(in_srgb,var(--color-red)_86%,white)]">
                      {calculateAbsentDays(matchedStudent.createdAt, matchedStudent.attendanceCount)}
                    </span>
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">{t("camera.lates", activeLang)}</span>
                    <span className="mt-1 text-2xl font-bold text-[color-mix(in_srgb,var(--color-amber)_92%,white)]">
                      {matchedStudent.latesCount}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm font-medium text-[var(--color-ink)]">{message}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_14%,var(--color-panel))] text-[var(--color-accent)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect width="6" height="6" x="9" y="9" rx="1"/></svg>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

