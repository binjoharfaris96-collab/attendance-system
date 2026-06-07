import { notFound } from "next/navigation";
import { 
  getStudentById, 
  listAttendanceForStudent, 
  listMisbehaviorReportsForStudent, 
  listStudents
} from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { getAppLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { Printer } from "lucide-react";

function translateIssueTypeLabel(issueType: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    "Class disruption": "behavior.classDisruption",
    "Disrespectful behavior": "behavior.disrespectful",
    Bullying: "behavior.bullying",
    Fighting: "behavior.fighting",
    "Phone misuse": "behavior.phoneMisuse",
    Cheating: "behavior.cheating",
    "Skipping class": "behavior.skipping",
    "Property damage": "behavior.propertyDamage",
    Other: "behavior.other",
  };

  const key = map[issueType];
  return key ? t(key) : issueType;
}

function calculateAbsentDays(createdAt: string, presentCount: number) {
  const start = new Date(createdAt);
  const now = new Date();
  let weekdays = 0;
  const cur = new Date(start);
  while(cur <= now) {
    const day = cur.getDay();
    if (day !== 5 && day !== 6) weekdays++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(0, weekdays - presentCount);
}

function calculateOverallGrade(sum: number) {
  if (sum >= 28) return 7;
  if (sum >= 26) return 6;
  if (sum >= 24) return 5;
  if (sum >= 22) return 4;
  if (sum >= 20) return 3;
  if (sum >= 18) return 2;
  if (sum >= 16) return 1;
  return 0;
}

export default async function StudentReportCardPage({ params }: { params: { studentId: string } }) {
  const { studentId } = await params;
  const student = await getStudentById(studentId);

  if (!student) {
    notFound();
  }

  const allStudents = await listStudents();
  const studentListItem = allStudents.find(s => s.id === studentId);
  const presentCount = studentListItem?.attendanceCount ?? 0;

  const attendance = await listAttendanceForStudent(studentId, 10);
  const behaviorReports = await listMisbehaviorReportsForStudent(studentId, 10);
  
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  const absDays = calculateAbsentDays(student.createdAt, presentCount);
  const gradeA = Math.max(0, 8 - absDays);
  const gradeB = Math.max(0, 8 - student.latesCount);
  const gradeC = Math.max(0, 8 - student.excusesCount);
  const gradeD = Math.max(0, 8 - student.breakLatesCount);

  const totalGradeSum = gradeA + gradeB + gradeC + gradeD;
  const overallGrade = calculateOverallGrade(totalGradeSum);

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto">
      {/* Action Bar (hidden in print) */}
      <div className="flex justify-end mb-8 print:hidden">
        <button 
          id="print-btn"
          className="btn btn--primary py-2 px-6 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Report Card
        </button>
        {/* Workaround for onClick in Server Component: use a small client script below */}
      </div>

      {/* Report Header */}
      <div className="border-b-4 border-black pb-6 mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-full mb-4 text-2xl font-black">
          {student.fullName.charAt(0)}
        </div>
        <h1 className="text-4xl font-black uppercase tracking-widest">{t("student.reportCard") || "Official Report Card"}</h1>
        <p className="text-gray-500 font-mono mt-2">{new Date().toLocaleDateString()}</p>
      </div>

      {/* Student Details */}
      <div className="grid grid-cols-2 gap-8 mb-8 border border-black p-6 rounded-lg bg-gray-50">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{t("student.fullName")}</p>
          <p className="text-xl font-bold">{student.fullName}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{t("student.studentCode")}</p>
          <p className="text-xl font-mono font-bold">{student.studentCode}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{t("student.className")}</p>
          <p className="text-lg font-medium">{student.className || t("student.unassigned")}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{t("student.dob") || "Date of Birth"}</p>
          <p className="text-lg font-medium">{student.dateOfBirth || "N/A"}</p>
        </div>
      </div>

      {/* Grading Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-6 border-b border-gray-200 pb-2">Academic & Behavioral Standing</h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-40 h-40 rounded-full border-8 border-black flex flex-col items-center justify-center">
            <span className="text-5xl font-black">{overallGrade}</span>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">/ 7</span>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="border border-gray-200 p-4 rounded-lg">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{t("student.absencesA")}</span>
              <p className="mt-1 text-2xl font-black">{gradeA}<span className="text-xs font-semibold text-gray-400">/8</span></p>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{t("student.latesB")}</span>
              <p className="mt-1 text-2xl font-black">{gradeB}<span className="text-xs font-semibold text-gray-400">/8</span></p>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{t("student.excusesC")}</span>
              <p className="mt-1 text-2xl font-black">{gradeC}<span className="text-xs font-semibold text-gray-400">/8</span></p>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{t("student.breakLatesD")}</span>
              <p className="mt-1 text-2xl font-black">{gradeD}<span className="text-xs font-semibold text-gray-400">/8</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Disciplinary Records */}
      <div className="mb-12">
        <h2 className="text-xl font-black uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Disciplinary Record (Recent)</h2>
        {behaviorReports.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 font-bold uppercase tracking-wider">Date</th>
                <th className="py-2 font-bold uppercase tracking-wider">Issue Type</th>
                <th className="py-2 font-bold uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody>
              {behaviorReports.map(report => (
                <tr key={report.id} className="border-b border-gray-200">
                  <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{formatDateTime(report.reportedAt)}</td>
                  <td className="py-3 pr-4 font-semibold">{translateIssueTypeLabel(report.issueType, t)}</td>
                  <td className="py-3 text-gray-700 italic">{report.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic">No recent disciplinary issues recorded. Excellent standing.</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t-2 border-black flex justify-between items-end">
        <div className="space-y-4">
          <div className="w-48 border-b border-black"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Administrator Signature</p>
        </div>
        <p className="text-xs text-gray-400 font-mono">Generated securely by Nexus LMS</p>
      </div>

      {/* Print Script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          const btn = document.getElementById('print-btn');
          if(btn) {
            btn.addEventListener('click', () => window.print());
          }
        `
      }} />
    </div>
  );
}
