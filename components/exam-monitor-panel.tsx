"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as faceapiType from "@vladmandic/face-api";
import { t, type AppLanguage } from "@/lib/i18n";

interface ExamMonitorPanelProps {
  registeredStudents: {
    studentCode: string;
    fullName: string;
    className: string;
    faceDescriptors: number[][];
  }[];
  enableUnknownFaceAlerts?: boolean;
  enablePhoneDetectionAlerts?: boolean;
  lang?: AppLanguage;
}

type CameraPhase =
  | "off"
  | "cam_starting"
  | "cam_live"
  | "ai_loading"
  | "active"
  | "error";

type DetectionObject = {
  class: string;
  bbox: [number, number, number, number];
};

type DetectionModel = {
  detect: (
    input: HTMLVideoElement,
    maxNumBoxes?: number,
    minScore?: number,
  ) => Promise<DetectionObject[]>;
};

export function ExamMonitorPanel({
  registeredStudents,
  enableUnknownFaceAlerts = true,
  enablePhoneDetectionAlerts = true,
  lang = "en",
}: ExamMonitorPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number>(0);
  const modelsReadyRef = useRef(false);
  const objectModelRef = useRef<DetectionModel | null>(null);
  const faceapiRef = useRef<typeof faceapiType | null>(null);
  const matcherRef = useRef<faceapiType.FaceMatcher | null>(null);
  const unknownStartRef = useRef<number | null>(null);
  const lastUnknownLogRef = useRef<number>(0);
  const phoneStartRef = useRef<number | null>(null);
  const lastPhoneLogRef = useRef<number>(0);

  const [phase, setPhase] = useState<CameraPhase>("off");
  const [msg, setMsg] = useState("");
  const [phoneAlert, setPhoneAlert] = useState(false);
  const [detectedNames, setDetectedNames] = useState<string[]>([]);
  const [unknownAlert, setUnknownAlert] = useState("");
  const [activeLang, setActiveLang] = useState<AppLanguage>(lang);

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

  const killCamera = useCallback(() => {
    if (loopRef.current) {
      clearTimeout(loopRef.current);
      loopRef.current = 0;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      killCamera();
    };
  }, [killCamera]);

  async function handleStart() {
    setPhase("cam_starting");
    setMsg(t("camera.requestingCamera", activeLang));
    setPhoneAlert(false);
    setUnknownAlert("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPhase("cam_live");
      setMsg(t("camera.cameraLiveLoadingAI", activeLang));
      void loadAIModels();
    } catch (error: unknown) {
      console.error("getUserMedia error:", error);
      setPhase("error");

      const errorName = error instanceof Error ? error.name : "UnknownError";
      const errorMessage =
        error instanceof Error ? error.message : t("camera.cameraError", activeLang);

      if (errorName === "NotReadableError") {
        setMsg(t("camera.cameraInUse", activeLang));
      } else if (errorName === "NotAllowedError") {
        setMsg(t("camera.permissionDenied", activeLang));
      } else if (errorName === "NotFoundError") {
        setMsg(t("camera.noCamera", activeLang));
      } else {
        setMsg(`${t("camera.cameraError", activeLang)}: ${errorMessage}`);
      }
    }
  }

  async function loadAIModels() {
    setPhase("ai_loading");

    try {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      setMsg(t("camera.loadingPhoneModel", activeLang));

      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      objectModelRef.current = (await cocoSsd.load({
        base: "mobilenet_v2",
      })) as DetectionModel;
      setMsg(t("camera.loadingFaceModel", activeLang));

      const faceapi = await import("@vladmandic/face-api");
      faceapiRef.current = faceapi;
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/ml-models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/ml-models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/ml-models"),
      ]);

      if (registeredStudents.length > 0) {
        const labeledDescriptors = registeredStudents.map((student) => {
          const descriptors = student.faceDescriptors.map(
            (entry) => new Float32Array(entry),
          );
          return new faceapi.LabeledFaceDescriptors(student.fullName, descriptors);
        });

        matcherRef.current = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
      }

      modelsReadyRef.current = true;
      setPhase("active");
      setMsg(t("camera.monitoringActive", activeLang));
    } catch (error) {
      console.error("Model load error:", error);
      setPhase("cam_live");
      setMsg(t("camera.aiLoadFailed", activeLang));
    }
  }

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceapi = faceapiRef.current;
    const objectModel = objectModelRef.current;
    const unknownLabel = t("camera.unknown", activeLang);

    if (!video || !canvas || !faceapi || !objectModel) {
      return;
    }

    if (video.readyState < 2 || video.paused || video.ended) {
      return;
    }

    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.clearRect(0, 0, vw, vh);

      const objects = await objectModel.detect(video, 20, 0.25);
      const hasPhone = objects.some(
        (prediction) => prediction.class === "cell phone",
      );
      const now = Date.now();

      if (hasPhone && enablePhoneDetectionAlerts) {
        if (phoneStartRef.current === null) {
          phoneStartRef.current = now;
        }

        const phoneElapsed = now - phoneStartRef.current;
        if (phoneElapsed >= 500 && now - lastPhoneLogRef.current > 10000) {
          lastPhoneLogRef.current = now;
          const offCanvas = document.createElement("canvas");
          const offCtx = offCanvas.getContext("2d");

          if (offCtx) {
            offCanvas.width = video.videoWidth;
            offCanvas.height = video.videoHeight;
            offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

            import("@/app/actions/recognition")
              .then((actions) => {
                void actions.logPhoneDetectionAction(
                  offCanvas.toDataURL("image/jpeg", 0.7),
                );
              })
              .catch((error) => {
                console.error("Phone detection log error:", error);
              });
          }
        }
      } else {
        phoneStartRef.current = null;
      }

      setPhoneAlert(enablePhoneDetectionAlerts ? hasPhone : false);

      for (const prediction of objects) {
        const [bx, by, bw, bh] = prediction.bbox;
        const isPhone = prediction.class === "cell phone";

        ctx.strokeStyle = isPhone ? "#ef4444" : "rgba(148,163,184,0.4)";
        ctx.lineWidth = isPhone ? 4 : 1;
        ctx.strokeRect(bx, by, bw, bh);

        if (isPhone) {
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 18px sans-serif";
          const labelWidth = ctx.measureText("PHONE").width;
          ctx.fillRect(bx, by - 28, labelWidth + 12, 28);
          ctx.fillStyle = "#fff";
          ctx.fillText("PHONE", bx + 6, by - 8);
        }
      }

      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 });
      const detections = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks()
        .withFaceDescriptors();

      const names: string[] = [];

      for (const detection of detections) {
        const { x, y, width, height } = detection.detection.box;
        let label = unknownLabel;
        let color = "#f59e0b";

        if (matcherRef.current) {
          const match = matcherRef.current.findBestMatch(detection.descriptor);

          if (match.label !== "unknown") {
            label = `${match.label} (${Math.round((1 - match.distance) * 100)}%)`;
            color = "#10b981";
            names.push(match.label);
            unknownStartRef.current = null;
          } else {
            names.push(unknownLabel);

            if (!enableUnknownFaceAlerts) {
              setUnknownAlert("");
            } else {
              if (unknownStartRef.current === null) {
                unknownStartRef.current = now;
              }

              const elapsed = now - unknownStartRef.current;
              if (elapsed < 2500) {
                setUnknownAlert(
                  `${t("camera.unknownCapturingPrefix", activeLang)} ${(
                    (2500 - elapsed) /
                    1000
                  ).toFixed(1)}s...`,
                );
              } else if (now - lastUnknownLogRef.current > 10000) {
                lastUnknownLogRef.current = now;
                setUnknownAlert(t("camera.unknownCapturedLogged", activeLang));

                const offCanvas = document.createElement("canvas");
                const offCtx = offCanvas.getContext("2d");

                if (offCtx) {
                  offCanvas.width = video.videoWidth;
                  offCanvas.height = video.videoHeight;
                  offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

                  import("@/app/actions/recognition")
                    .then((actions) => {
                      void actions.logUnknownFaceAction(
                        offCanvas.toDataURL("image/jpeg", 0.7),
                      );
                    })
                    .catch((error) => {
                      console.error("Unknown face log error:", error);
                    });
                }
              } else {
                setUnknownAlert(t("camera.unknownDetectedMonitoring", activeLang));
              }
            }
          }
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = color;
        ctx.font = "bold 15px sans-serif";
        const labelWidth = ctx.measureText(label).width;
        ctx.fillRect(x, y - 26, labelWidth + 10, 26);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, x + 5, y - 8);
      }

      setDetectedNames(names);
      if (!names.includes(unknownLabel)) {
        setUnknownAlert("");
      }
    } catch (error) {
      console.error("Detection error:", error);
    }
  }, [activeLang, enablePhoneDetectionAlerts, enableUnknownFaceAlerts]);

  useEffect(() => {
    if (phase !== "active") {
      return;
    }

    let stopped = false;
    async function tick() {
      if (stopped) {
        return;
      }

      await runDetection();
      if (!stopped) {
        loopRef.current = window.setTimeout(tick, 500) as unknown as number;
      }
    }

    void tick();

    return () => {
      stopped = true;
      clearTimeout(loopRef.current);
      loopRef.current = 0;
    };
  }, [phase, runDetection]);

  function handleStop() {
    killCamera();
    modelsReadyRef.current = false;
    setPhase("off");
    setMsg("");
    setPhoneAlert(false);
    setUnknownAlert("");
  }

  const isRunning = phase !== "off" && phase !== "error";
  const showFeed = phase !== "off";
  const unknownLabel = t("camera.unknown", activeLang);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {t("camera.liveExamMonitor", activeLang)}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {t("camera.identifiesStudents", activeLang)}
            </p>
          </div>
          <div>
            {phase === "off" && (
              <button onClick={handleStart} className="btn btn--primary">
                {t("camera.startMonitoring", activeLang)}
              </button>
            )}
            {phase === "error" && (
              <button onClick={handleStart} className="btn btn--primary">
                {t("camera.retry", activeLang)}
              </button>
            )}
            {isRunning && (
              <button
                onClick={handleStop}
                className="btn btn--danger"
              >
                {t("camera.stopCamera", activeLang)}
              </button>
            )}
          </div>
        </div>

        {msg && (
          <div
            className={`mt-3 text-center text-sm font-medium p-2.5 rounded-lg ${
              phase === "error"
                ? "border border-[color-mix(in_srgb,var(--color-red)_44%,transparent)] bg-[color-mix(in_srgb,var(--color-red-light)_72%,transparent)] text-[color-mix(in_srgb,var(--color-red)_86%,white)]"
                : phase === "active"
                  ? "border border-[color-mix(in_srgb,var(--color-green)_44%,transparent)] bg-[color-mix(in_srgb,var(--color-green-light)_72%,transparent)] text-[color-mix(in_srgb,var(--color-green)_82%,white)]"
                  : "border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-accent-light)_48%,transparent)] text-[var(--color-ink)]"
            }`}
          >
            {msg}
          </div>
        )}
      </div>

      {phoneAlert && (
        <div className="animate-pulse rounded-lg border border-[color-mix(in_srgb,var(--color-red)_44%,transparent)] border-l-4 border-l-[color-mix(in_srgb,var(--color-red)_86%,white)] bg-[color-mix(in_srgb,var(--color-red-light)_74%,transparent)] p-4">
          <div className="flex items-center gap-3 text-[color-mix(in_srgb,var(--color-red)_86%,white)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="font-bold flex-1">
              {t("camera.phoneDetected", activeLang)}
            </div>
          </div>
        </div>
      )}

      {enableUnknownFaceAlerts && unknownAlert && (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--color-amber)_44%,transparent)] border-l-4 border-l-[color-mix(in_srgb,var(--color-amber)_90%,white)] bg-[color-mix(in_srgb,var(--color-amber-light)_72%,transparent)] p-4">
          <div className="flex items-center gap-3 text-[color-mix(in_srgb,var(--color-amber)_94%,white)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m10.29 3.86-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3.14l-8-14a2 2 0 0 0-3.46 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="font-semibold flex-1">{unknownAlert}</div>
          </div>
        </div>
      )}

      <div
        className="grid gap-4 lg:grid-cols-[1fr_300px]"
        style={{ display: showFeed ? "grid" : "none" }}
      >
        <div className="card card--no-pad overflow-hidden">
          <div
            className="relative w-full bg-[color-mix(in_srgb,var(--surface-0)_86%,black)]"
            style={{ aspectRatio: "4/3", maxHeight: "620px" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width={640}
              height={480}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[var(--color-ink)] uppercase tracking-wider">
            {t("camera.detectionInfo", activeLang)}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-muted)]">
                {t("camera.status", activeLang)}
              </span>
              <span
                className={`badge ${
                  phase === "active" ? "badge--green" : "badge--amber"
                }`}
              >
                {phase === "active"
                  ? t("camera.active", activeLang)
                  : phase === "error"
                    ? t("camera.error", activeLang)
                    : t("camera.loading2", activeLang)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-muted)]">
                {t("camera.registeredFaces", activeLang)}
              </span>
              <span className="text-sm font-bold text-[var(--color-ink)]">
                {registeredStudents.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-muted)]">
                {t("camera.phoneDetection", activeLang)}
              </span>
              <span className={`badge ${phoneAlert ? "badge--red" : "badge--green"}`}>
                {phoneAlert
                  ? t("camera.detected", activeLang)
                  : t("camera.clear", activeLang)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-muted)]">
                {t("camera.facesOnScreen", activeLang)}
              </span>
              <span className="text-sm font-bold text-[var(--color-ink)]">
                {detectedNames.length}
              </span>
            </div>
          </div>

          {detectedNames.length > 0 && (
            <>
              <hr className="border-[var(--color-line)]" />
              <div>
                <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                  {t("camera.currentlyDetected", activeLang)}
                </h4>
                <div className="space-y-1.5">
                  {detectedNames.map((name, index) => (
                    <div
                      key={`${name}-${index}`}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border ${
                        name === unknownLabel
                          ? "border-[color-mix(in_srgb,var(--color-amber)_42%,transparent)] bg-[color-mix(in_srgb,var(--color-amber-light)_58%,transparent)]"
                          : "border-[color-mix(in_srgb,var(--color-green)_42%,transparent)] bg-[color-mix(in_srgb,var(--color-green-light)_58%,transparent)]"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                          name === unknownLabel
                            ? "bg-[color-mix(in_srgb,var(--color-amber)_28%,transparent)] text-[color-mix(in_srgb,var(--color-amber)_96%,white)]"
                            : "bg-[color-mix(in_srgb,var(--color-green)_28%,transparent)] text-[color-mix(in_srgb,var(--color-green)_90%,white)]"
                        }`}
                      >
                        {name.charAt(0)}
                      </span>
                      <p className="text-xs font-semibold truncate">{name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <hr className="border-[var(--color-line)]" />

          <div>
            <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
              {t("camera.registeredStudents", activeLang)}
            </h4>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {registeredStudents.length > 0 ? (
                registeredStudents.map((student) => (
                  <div
                    key={student.studentCode}
                    className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--surface-1)_78%,transparent)] px-2.5 py-1.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-green)_24%,transparent)] text-xs font-bold text-[color-mix(in_srgb,var(--color-green)_90%,white)]">
                      {student.fullName.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-ink)] truncate">
                        {student.fullName}
                      </p>
                      <p className="text-[10px] text-[var(--color-muted)]">
                        {student.studentCode}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--color-muted)] text-center py-3">
                  {t("camera.noFaceProfiles", activeLang)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
