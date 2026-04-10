import { ExamMonitorPanel } from "@/components/exam-monitor-panel";
import { getSetting, listStudents } from "@/lib/db";
import { createTranslator } from "@/lib/i18n";
import { getAppLanguage } from "@/lib/i18n-server";

export default async function ExamMonitorPage() {
  const allStudents = await listStudents();
  const unknownFaceAlertsEnabled =
    (await getSetting("alerts_unknown_face_enabled", "true")) === "true";
  const phoneDetectionAlertsEnabled =
    (await getSetting("alerts_phone_detection_enabled", "true")) === "true";
  const lang = await getAppLanguage();
  const t = createTranslator(lang);
  
  // Filter out students who haven't completed face registration
  const validStudents = allStudents
    .filter(s => s.faceDescriptors && s.faceDescriptors.length > 0)
    .map(s => ({
      studentCode: s.studentCode,
      fullName: s.fullName,
      className: s.className || t("common.unassigned"),
      attendanceCount: s.attendanceCount || 0,
      latesCount: s.latesCount || 0,
      createdAt: s.createdAt,
      faceDescriptors: s.faceDescriptors as number[][]
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("examMonitor.title")}</h1>
          <p className="page-subtitle">{t("examMonitor.subtitle")}</p>
        </div>
      </div>

      <ExamMonitorPanel
        registeredStudents={validStudents}
        enableUnknownFaceAlerts={unknownFaceAlertsEnabled}
        enablePhoneDetectionAlerts={phoneDetectionAlertsEnabled}
        lang={lang}
      />
    </div>
  );
}
