export type ActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const idleActionState: ActionState = {
  status: "idle",
  message: "",
};

export type Session = {
  email: string;
  role: string;
  expiresAt: number;
};

export type Student = {
  id: string;
  studentCode: string;
  fullName: string;
  className: string | null;
  faceDescriptors: number[][] | null;
  photoUrl: string | null;
  latesCount: number;
  excusesCount: number;
  breakLatesCount: number;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
};

export type StudentListItem = Student & {
  attendanceCount: number;
  lastAttendanceAt: string | null;
  userEmail: string | null;
};

export type AttendanceEvent = {
  id: string;
  studentId: string;
  studentCodeSnapshot: string;
  fullNameSnapshot: string;
  classNameSnapshot: string | null;
  source: string;
  notes: string | null;
  attendanceDate: string;
  capturedAt: string;
};

export type DashboardSummary = {
  totalStudents: number;
  todayAttendance: number;
  attendanceLast7Days: number;
};

export type DailyAttendanceCount = {
  day: string;
  total: number;
};

/** Today's headcount: on-time check-ins, late check-ins, and registered students with no check-in. */
export type TodayAttendanceBreakdown = {
  totalStudents: number;
  onTime: number;
  late: number;
  absent: number;
};

export type MisbehaviorReport = {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string | null;
  issueType: string;
  notes: string | null;
  reportedAt: string;
  reportedBy: string | null;
};
