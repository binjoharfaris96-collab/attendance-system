import "server-only";

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  formatDateLabel,
  isoNow,
  shiftDate,
  toAttendanceDate,
} from "@/lib/time";
import type {
  AttendanceEvent,
  DailyAttendanceCount,
  DashboardSummary,
  MisbehaviorReport,
  Student,
  StudentListItem,
} from "@/lib/types";

type DatabaseGlobal = {
  database?: DatabaseSync;
  isReady?: boolean;
};

const globalForDatabase = globalThis as typeof globalThis & DatabaseGlobal;

function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: String(row.id),
    studentCode: String(row.studentCode),
    fullName: String(row.fullName),
    className: row.className ? String(row.className) : null,
    faceDescriptors: row.faceDescriptors
      ? (JSON.parse(String(row.faceDescriptors)) as number[][])
      : null,
    photoUrl: row.photoUrl ? String(row.photoUrl) : null,
    latesCount: Number(row.latesCount ?? 0),
    excusesCount: Number(row.excusesCount ?? 0),
    breakLatesCount: Number(row.breakLatesCount ?? 0),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

function mapAttendanceEvent(row: Record<string, unknown>): AttendanceEvent {
  return {
    id: String(row.id),
    studentId: String(row.studentId),
    studentCodeSnapshot: String(row.studentCodeSnapshot),
    fullNameSnapshot: String(row.fullNameSnapshot),
    classNameSnapshot: row.classNameSnapshot
      ? String(row.classNameSnapshot)
      : null,
    source: String(row.source),
    notes: row.notes ? String(row.notes) : null,
    attendanceDate: String(row.attendanceDate),
    capturedAt: String(row.capturedAt),
  };
}

function mapMisbehaviorReport(row: Record<string, unknown>): MisbehaviorReport {
  return {
    id: String(row.id),
    studentId: String(row.studentId),
    studentName: String(row.studentName),
    studentCode: String(row.studentCode),
    className: row.className ? String(row.className) : null,
    issueType: String(row.issueType),
    notes: row.notes ? String(row.notes) : null,
    reportedAt: String(row.reportedAt),
    reportedBy: row.reportedBy ? String(row.reportedBy) : null,
  };
}

function mapStudentListItem(row: Record<string, unknown>): StudentListItem {
  return {
    ...mapStudent(row),
    attendanceCount: Number(row.attendanceCount ?? 0),
    lastAttendanceAt: row.lastAttendanceAt ? String(row.lastAttendanceAt) : null,
  };
}

function getDatabaseFilePath() {
  const isVercel = process.env.VERCEL === "1";
  
  if (isVercel) {
    // Vercel filesystem is read-only except for /tmp
    return join("/tmp", "attendance.sqlite");
  }

  const dataDirectory = join(process.cwd(), "data");

  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  return join(dataDirectory, "attendance.sqlite");
}

function initializeDatabase(database: DatabaseSync) {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      class_name TEXT,
      face_descriptors TEXT,
      lates_count INTEGER DEFAULT 0,
      excuses_count INTEGER DEFAULT 0,
      break_lates_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_events (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_code_snapshot TEXT NOT NULL,
      full_name_snapshot TEXT NOT NULL,
      class_name_snapshot TEXT,
      source TEXT NOT NULL,
      notes TEXT,
      attendance_date TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_events_student
      ON attendance_events(student_id, captured_at DESC);

    CREATE INDEX IF NOT EXISTS idx_attendance_events_date
      ON attendance_events(attendance_date, captured_at DESC);
  `);
}

export function getDatabase() {
  if (!globalForDatabase.database) {
    globalForDatabase.database = new DatabaseSync(getDatabaseFilePath());
  }

  const db = globalForDatabase.database;

  // We explicitly run these lightweight auto-migrations every time in dev to avoid HMR state bugs skipping them
  try { db.exec('ALTER TABLE students ADD COLUMN face_descriptors TEXT;'); } catch {}
  try { db.exec('ALTER TABLE students ADD COLUMN lates_count INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE students ADD COLUMN excuses_count INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE students ADD COLUMN break_lates_count INTEGER DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE students ADD COLUMN photo_url TEXT;'); } catch {}
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS misbehavior_reports (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_name_snapshot TEXT,
        issue_type TEXT NOT NULL,
        notes TEXT,
        reported_by TEXT,
        reported_at TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_misbehavior_student
        ON misbehavior_reports(student_id, reported_at DESC);
      CREATE INDEX IF NOT EXISTS idx_misbehavior_reported_at
        ON misbehavior_reports(reported_at DESC);
    `);
  } catch {}

  if (!globalForDatabase.isReady) {
    initializeDatabase(db);
    db.exec(`
      CREATE TABLE IF NOT EXISTS unknown_faces (
        id TEXT PRIMARY KEY,
        image_data TEXT NOT NULL,
        detected_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS phone_detections (
        id TEXT PRIMARY KEY,
        image_data TEXT NOT NULL,
        detected_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS absence_excuses (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        excuse_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS misbehavior_reports (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_name_snapshot TEXT,
        issue_type TEXT NOT NULL,
        notes TEXT,
        reported_by TEXT,
        reported_at TEXT NOT NULL,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_misbehavior_student
        ON misbehavior_reports(student_id, reported_at DESC);
      CREATE INDEX IF NOT EXISTS idx_misbehavior_reported_at
        ON misbehavior_reports(reported_at DESC);
      INSERT OR IGNORE INTO app_settings (key, value) VALUES ('late_cutoff_minutes', '470');
    `);
    
    globalForDatabase.isReady = true;
  }

  return db;
}

function normalizeStudentCode(value: string) {
  return value.trim().toUpperCase();
}

function sanitizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function listStudents() {
  const database = getDatabase();
  const rows = database
    .prepare(`
      SELECT
        s.id,
        s.student_code AS studentCode,
        s.full_name AS fullName,
        s.class_name AS className,
        s.face_descriptors AS faceDescriptors,
        s.photo_url AS photoUrl,
        s.lates_count AS latesCount,
        s.excuses_count AS excusesCount,
        s.break_lates_count AS breakLatesCount,
        s.created_at AS createdAt,
        s.updated_at AS updatedAt,
        COUNT(a.id) AS attendanceCount,
        MAX(a.captured_at) AS lastAttendanceAt
      FROM students s
      LEFT JOIN attendance_events a ON a.student_id = s.id
      GROUP BY s.id
      ORDER BY s.full_name COLLATE NOCASE ASC
    `)
    .all() as Record<string, unknown>[];

  return rows.map(mapStudentListItem);
}



export function getStudentById(studentId: string) {
  const database = getDatabase();
  const row = database
    .prepare(`
      SELECT
        id,
        student_code AS studentCode,
        full_name AS fullName,
        class_name AS className,
        face_descriptors AS faceDescriptors,
        photo_url AS photoUrl,
        lates_count AS latesCount,
        excuses_count AS excusesCount,
        break_lates_count AS breakLatesCount,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM students
      WHERE id = :studentId
      LIMIT 1
    `)
    .get({ studentId }) as Record<string, unknown> | undefined;

  return row ? mapStudent(row) : null;
}

export function createStudent(input: {
  studentCode: string;
  fullName: string;
  className?: string | null;
  faceDescriptors?: number[][] | null;
  photoUrl?: string | null;
}) {
  const database = getDatabase();
  const now = isoNow();

  const student: Student = {
    id: randomUUID(),
    studentCode: normalizeStudentCode(input.studentCode),
    fullName: input.fullName.trim(),
    className: sanitizeOptional(input.className),
    faceDescriptors: input.faceDescriptors ?? null,
    photoUrl: input.photoUrl ?? null,
    latesCount: 0,
    excusesCount: 0,
    breakLatesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  database
    .prepare(`
      INSERT INTO students (
        id,
        student_code,
        full_name,
        class_name,
        face_descriptors,
        photo_url,
        lates_count,
        excuses_count,
        break_lates_count,
        created_at,
        updated_at
      ) VALUES (
        :id,
        :studentCode,
        :fullName,
        :className,
        :faceDescriptors,
        :photoUrl,
        :latesCount,
        :excusesCount,
        :breakLatesCount,
        :createdAt,
        :updatedAt
      )
    `)
    .run({
      ...student,
      faceDescriptors: student.faceDescriptors
        ? JSON.stringify(student.faceDescriptors)
        : null,
    });

  return student;
}

export function updateStudent(
  studentId: string,
  input: {
    studentCode: string;
    fullName: string;
    className?: string | null;
    faceDescriptors?: number[][] | null;
    photoUrl?: string | null;
  },
) {
  const database = getDatabase();
  const current = getStudentById(studentId);

  if (!current) {
    throw new Error("Student not found.");
  }

  const updatedStudent: Student = {
    ...current,
    studentCode: normalizeStudentCode(input.studentCode),
    fullName: input.fullName.trim(),
    className: sanitizeOptional(input.className),
    faceDescriptors: input.faceDescriptors !== undefined ? input.faceDescriptors : current.faceDescriptors,
    photoUrl: input.photoUrl !== undefined ? input.photoUrl : current.photoUrl,
    updatedAt: isoNow(),
  };

  database
    .prepare(`
      UPDATE students
      SET
        student_code = :studentCode,
        full_name = :fullName,
        class_name = :className,
        face_descriptors = :faceDescriptors,
        photo_url = :photoUrl,
        updated_at = :updatedAt
      WHERE id = :id
    `)
    .run({
      ...updatedStudent,
      faceDescriptors: updatedStudent.faceDescriptors ? JSON.stringify(updatedStudent.faceDescriptors) : null,
    });

  return updatedStudent;
}

export function deleteStudent(studentId: string) {
  const database = getDatabase();
  const current = getStudentById(studentId);

  if (!current) {
    throw new Error("Student not found.");
  }

  // Delete attendance sequentially (no complex transaction needed since sync)
  database.prepare(`DELETE FROM attendance_events WHERE student_id = ?`).run(studentId);
  database.prepare(`DELETE FROM students WHERE id = ?`).run(studentId);

  return true;
}

export function listRecentAttendance(limit = 12) {
  const database = getDatabase();
  const rows = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      ORDER BY captured_at DESC
      LIMIT :limit
    `)
    .all({ limit }) as Record<string, unknown>[];

  return rows.map(mapAttendanceEvent);
}

export function listAttendanceForStudent(studentId: string, limit = 20) {
  const database = getDatabase();
  const rows = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      WHERE student_id = :studentId
      ORDER BY captured_at DESC
      LIMIT :limit
    `)
    .all({ studentId, limit }) as Record<string, unknown>[];

  return rows.map(mapAttendanceEvent);
}

export function listAttendanceReport(limit = 200, date?: string | null) {
  const database = getDatabase();

  if (date) {
    const rows = database
      .prepare(`
        SELECT
          id,
          student_id AS studentId,
          student_code_snapshot AS studentCodeSnapshot,
          full_name_snapshot AS fullNameSnapshot,
          class_name_snapshot AS classNameSnapshot,
          source,
          notes,
          attendance_date AS attendanceDate,
          captured_at AS capturedAt
        FROM attendance_events
        WHERE attendance_date = :date
        ORDER BY captured_at DESC
        LIMIT :limit
      `)
      .all({ date, limit }) as Record<string, unknown>[];

    return rows.map(mapAttendanceEvent);
  }

  return listRecentAttendance(limit);
}

export function getDashboardSummary() {
  const database = getDatabase();
  const today = toAttendanceDate(isoNow());
  const sevenDaysAgo = shiftDate(today, -6);

  const totalStudents =
    (database.prepare(`SELECT COUNT(*) AS total FROM students`).get() as {
      total: number;
    }).total ?? 0;

  const todayAttendance =
    (
      database
        .prepare(
          `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date = :today`,
        )
        .get({ today }) as { total: number }
    ).total ?? 0;

  const attendanceLast7Days =
    (
      database
        .prepare(
          `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date >= :sevenDaysAgo`,
        )
        .get({ sevenDaysAgo }) as { total: number }
    ).total ?? 0;

  const summary: DashboardSummary = {
    totalStudents: Number(totalStudents),
    todayAttendance: Number(todayAttendance),
    attendanceLast7Days: Number(attendanceLast7Days),
  };

  return summary;
}

export function getDailyAttendanceCounts(days = 7) {
  const database = getDatabase();
  const today = toAttendanceDate(isoNow());
  const start = shiftDate(today, days * -1 + 1);

  const rows = database
    .prepare(`
      SELECT attendance_date AS day, COUNT(*) AS total
      FROM attendance_events
      WHERE attendance_date >= :start
      GROUP BY attendance_date
      ORDER BY attendance_date ASC
    `)
    .all({ start }) as Record<string, unknown>[];

  const countsByDay = new Map(
    rows.map((row) => [String(row.day), Number(row.total ?? 0)]),
  );

  const timeline: DailyAttendanceCount[] = [];

  for (let index = 0; index < days; index += 1) {
    const day = shiftDate(start, index);

    timeline.push({
      day,
      total: countsByDay.get(day) ?? 0,
    });
  }

  return timeline;
}

export function getRosterSnapshot() {
  const students = listStudents();
  const summary = getDashboardSummary();
  const dailyCounts = getDailyAttendanceCounts(7);
  const latestDay =
    dailyCounts[dailyCounts.length - 1]?.day ??
    toAttendanceDate(isoNow());

  return {
    students,
    summary,
    dailyCounts: dailyCounts.map((entry) => ({
      ...entry,
      label: formatDateLabel(entry.day),
      isToday: entry.day === latestDay,
    })),
  };
}

export function recordAttendanceByStudentCode(input: {
  studentCode: string;
  notes?: string | null;
  source?: string;
}) {
  const database = getDatabase();
  const studentCode = normalizeStudentCode(input.studentCode);
  const student = database
    .prepare(`
      SELECT
        id,
        student_code AS studentCode,
        full_name AS fullName,
        class_name AS className,
        photo_url AS photoUrl,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM students
      WHERE student_code = :studentCode
      LIMIT 1
    `)
    .get({ studentCode }) as Record<string, unknown> | undefined;

  if (!student) {
    return {
      status: "missing" as const,
      message: `No student was found for ID ${studentCode}.`,
    };
  }

  const mappedStudent = mapStudent(student);
  const capturedAt = isoNow();
  const attendanceDate = toAttendanceDate(capturedAt);

  const duplicate = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      WHERE student_id = :studentId AND attendance_date = :attendanceDate
      ORDER BY captured_at DESC
      LIMIT 1
    `)
    .get({
      studentId: mappedStudent.id,
      attendanceDate,
    }) as Record<string, unknown> | undefined;

  if (duplicate) {
    const existing = mapAttendanceEvent(duplicate);

    return {
      status: "duplicate" as const,
      message: `${mappedStudent.fullName} has already been checked in today.`,
      event: existing,
    };
  }

  const localTimeString = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(capturedAt));
  const [hour, minute] = localTimeString.split(":").map(Number);
  const minutesSinceMidnight = hour * 60 + minute;

  // Read open and close times from settings
  const openTimeStr = database.prepare(`SELECT value FROM app_settings WHERE key = 'check_in_open_minutes'`).get() as { value: string } | undefined;
  const openTimeMinutes = openTimeStr ? parseInt(openTimeStr.value, 10) : 0;

  const closeTimeStr = database.prepare(`SELECT value FROM app_settings WHERE key = 'check_in_close_minutes'`).get() as { value: string } | undefined;
  const closeTimeMinutes = closeTimeStr ? parseInt(closeTimeStr.value, 10) : 1439;

  if (minutesSinceMidnight < openTimeMinutes) {
    const openH = Math.floor(openTimeMinutes / 60);
    const openM = openTimeMinutes % 60;
    const formattedTime = new Date(0, 0, 0, openH, openM).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return {
      status: "rejected" as const,
      message: `Check-in is not open until ${formattedTime}.`,
    };
  }

  if (minutesSinceMidnight > closeTimeMinutes) {
    const closeH = Math.floor(closeTimeMinutes / 60);
    const closeM = closeTimeMinutes % 60;
    const formattedTime = new Date(0, 0, 0, closeH, closeM).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return {
      status: "rejected" as const,
      message: `After ${formattedTime} check-in is closed. ${mappedStudent.fullName} is marked absent for today.`,
    };
  }

  const event: AttendanceEvent = {
    id: randomUUID(),
    studentId: mappedStudent.id,
    studentCodeSnapshot: mappedStudent.studentCode,
    fullNameSnapshot: mappedStudent.fullName,
    classNameSnapshot: mappedStudent.className,
    source: input.source?.trim() || "manual_checkin",
    notes: sanitizeOptional(input.notes),
    attendanceDate,
    capturedAt,
  };

  database
    .prepare(`
      INSERT INTO attendance_events (
        id,
        student_id,
        student_code_snapshot,
        full_name_snapshot,
        class_name_snapshot,
        source,
        notes,
        attendance_date,
        captured_at
      ) VALUES (
        :id,
        :studentId,
        :studentCodeSnapshot,
        :fullNameSnapshot,
        :classNameSnapshot,
        :source,
        :notes,
        :attendanceDate,
        :capturedAt
      )
    `)
    .run(event);

  // Read late cutoff from settings, default to 470 (7:50 AM)
  const lateCutoffStr = database.prepare(`SELECT value FROM app_settings WHERE key = 'late_cutoff_minutes'`).get() as { value: string } | undefined;
  const lateCutoffMinutes = lateCutoffStr ? parseInt(lateCutoffStr.value, 10) : 470;

  if (minutesSinceMidnight > lateCutoffMinutes) {
    database.prepare(`
      UPDATE students
      SET lates_count = IFNULL(lates_count, 0) + 1,
          updated_at = :updatedAt
      WHERE id = :id
    `).run({
      id: mappedStudent.id,
      updatedAt: capturedAt,
    });
    
    // Sync the return object to include the newly added late point
    mappedStudent.latesCount += 1;
  }

  return {
    status: "created" as const,
    message: `${mappedStudent.fullName} is marked present for today.`,
    event,
    student: mappedStudent,
  };
}

export type UnknownFace = {
  id: string;
  imageData: string;
  detectedAt: string;
};

export function recordUnknownFace(base64Image: string) {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const detectedAt = isoNow();

  database.prepare(`
    INSERT INTO unknown_faces (id, image_data, detected_at)
    VALUES (?, ?, ?)
  `).run(id, base64Image, detectedAt);

  return { id, detectedAt };
}

export function listUnknownFaces(limit = 50) {
  const database = getDatabase();
  return database.prepare(`
    SELECT 
      id, 
      image_data AS imageData, 
      detected_at AS detectedAt
    FROM unknown_faces
    ORDER BY detected_at DESC
    LIMIT ?
  `).all(limit) as UnknownFace[];
}

export function clearUnknownFaces() {
  const database = getDatabase();
  database.prepare(`DELETE FROM unknown_faces`).run();
  return true;
}

export function countUnknownFaces() {
  const database = getDatabase();
  const row = database.prepare(`SELECT COUNT(*) as count FROM unknown_faces`).get() as { count: number };
  return row.count;
}

export type PhoneDetection = {
  id: string;
  imageData: string;
  detectedAt: string;
};

export function recordPhoneDetection(base64Image: string) {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const detectedAt = isoNow();

  database.prepare(`
    INSERT INTO phone_detections (id, image_data, detected_at)
    VALUES (?, ?, ?)
  `).run(id, base64Image, detectedAt);

  return { id, detectedAt };
}

export function listPhoneDetections(limit = 50) {
  const database = getDatabase();
  return database.prepare(`
    SELECT 
      id, 
      image_data AS imageData, 
      detected_at AS detectedAt
    FROM phone_detections
    ORDER BY detected_at DESC
    LIMIT ?
  `).all(limit) as PhoneDetection[];
}

export function clearPhoneDetections() {
  const database = getDatabase();
  database.prepare(`DELETE FROM phone_detections`).run();
  return true;
}

export function countPhoneDetections() {
  const database = getDatabase();
  const row = database.prepare(`SELECT COUNT(*) as count FROM phone_detections`).get() as { count: number };
  return row.count;
}

export function updateStudentDisciplinaryCount(studentId: string, eventType: "late" | "excused" | "break_late", amount: number) {
  const database = getDatabase();
  const current = getStudentById(studentId);

  if (!current) {
    throw new Error("Student not found.");
  }

  let columnToUpdate = "";
  if (eventType === "late") columnToUpdate = "lates_count";
  if (eventType === "excused") columnToUpdate = "excuses_count";
  if (eventType === "break_late") columnToUpdate = "break_lates_count";

  if (!columnToUpdate) throw new Error("Invalid event type.");

  database.prepare(`
    UPDATE students
    SET ${columnToUpdate} = MAX(0, IFNULL(${columnToUpdate}, 0) + :amount),
        updated_at = :updatedAt
    WHERE id = :id
  `).run({
    id: studentId,
    updatedAt: isoNow(),
    amount,
  });

  return true;
}

export function getSetting(key: string, defaultValue: string): string {
  const database = getDatabase();
  const row = database.prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

export function updateSetting(key: string, value: string) {
  const database = getDatabase();
  database.prepare(`
    INSERT INTO app_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
  return true;
}

export function createMisbehaviorReport(input: {
  studentId: string;
  className?: string | null;
  issueType: string;
  notes?: string | null;
  reportedBy?: string | null;
}) {
  const database = getDatabase();
  const student = getStudentById(input.studentId);

  if (!student) {
    throw new Error("Student not found.");
  }

  const issueType = input.issueType.trim();
  if (!issueType) {
    throw new Error("Issue type is required.");
  }

  const report = {
    id: randomUUID(),
    studentId: student.id,
    className: sanitizeOptional(input.className) ?? student.className,
    issueType,
    notes: sanitizeOptional(input.notes),
    reportedBy: sanitizeOptional(input.reportedBy),
    reportedAt: isoNow(),
  };

  database.prepare(`
    INSERT INTO misbehavior_reports (
      id,
      student_id,
      class_name_snapshot,
      issue_type,
      notes,
      reported_by,
      reported_at
    ) VALUES (
      :id,
      :studentId,
      :className,
      :issueType,
      :notes,
      :reportedBy,
      :reportedAt
    )
  `).run(report);

  return report;
}

export function listRecentMisbehaviorReports(limit = 50) {
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT
      r.id,
      r.student_id AS studentId,
      s.full_name AS studentName,
      s.student_code AS studentCode,
      r.class_name_snapshot AS className,
      r.issue_type AS issueType,
      r.notes AS notes,
      r.reported_at AS reportedAt,
      r.reported_by AS reportedBy
    FROM misbehavior_reports r
    JOIN students s ON s.id = r.student_id
    ORDER BY r.reported_at DESC
    LIMIT ?
  `).all(limit) as Record<string, unknown>[];

  return rows.map(mapMisbehaviorReport);
}

export function listMisbehaviorReportsForStudent(studentId: string, limit = 30) {
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT
      r.id,
      r.student_id AS studentId,
      s.full_name AS studentName,
      s.student_code AS studentCode,
      r.class_name_snapshot AS className,
      r.issue_type AS issueType,
      r.notes AS notes,
      r.reported_at AS reportedAt,
      r.reported_by AS reportedBy
    FROM misbehavior_reports r
    JOIN students s ON s.id = r.student_id
    WHERE r.student_id = :studentId
    ORDER BY r.reported_at DESC
    LIMIT :limit
  `).all({ studentId, limit }) as Record<string, unknown>[];

  return rows.map(mapMisbehaviorReport);
}

export type Excuse = {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  excuseDate: string;
  createdAt: string;
};

export function createExcuse(studentId: string, reason: string, excuseDate: string) {
  const database = getDatabase();
  const id = crypto.randomUUID();
  const now = isoNow();

  // Deduct 1 from lates_count and add 1 to excuses_count
  database.prepare(`
    UPDATE students
    SET lates_count = MAX(0, IFNULL(lates_count, 0) - 1),
        excuses_count = IFNULL(excuses_count, 0) + 1,
        updated_at = :updatedAt
    WHERE id = :id
  `).run({
    id: studentId,
    updatedAt: now,
  });

  database.prepare(`
    INSERT INTO absence_excuses (id, student_id, reason, excuse_date, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, studentId, reason.trim(), excuseDate, now);

  return true;
}

export function listExcuses(limit = 50) {
  const database = getDatabase();
  return database.prepare(`
    SELECT 
      e.id, 
      e.student_id AS studentId,
      s.full_name AS studentName,
      e.reason,
      e.excuse_date AS excuseDate,
      e.created_at AS createdAt
    FROM absence_excuses e
    JOIN students s ON e.student_id = s.id
    ORDER BY e.created_at DESC
    LIMIT ?
  `).all(limit) as Excuse[];
}

export function deleteExcuse(id: string) {
  const database = getDatabase();
  // Fetch excuse to find owner
  const excuse = database.prepare(`SELECT student_id FROM absence_excuses WHERE id = ?`).get(id) as { student_id: string } | undefined;
  if (!excuse) return false;

  // Revert the counts
  database.prepare(`
    UPDATE students
    SET lates_count = IFNULL(lates_count, 0) + 1,
        excuses_count = MAX(0, IFNULL(excuses_count, 0) - 1),
        updated_at = :updatedAt
    WHERE id = :studentId
  `).run({
    studentId: excuse.student_id,
    updatedAt: isoNow(),
  });

  database.prepare(`DELETE FROM absence_excuses WHERE id = ?`).run(id);
  return true;
}

type BackupSettingEntry = {
  key: string;
  value: string;
};

type BackupExcuseEntry = {
  id: string;
  studentId: string;
  reason: string;
  excuseDate: string;
  createdAt: string;
};

type BackupMisbehaviorEntry = {
  id: string;
  studentId: string;
  className: string | null;
  issueType: string;
  notes: string | null;
  reportedBy: string | null;
  reportedAt: string;
};

export type SystemBackupPayload = {
  version: 1;
  exportedAt: string;
  data: {
    students: Student[];
    attendanceEvents: AttendanceEvent[];
    unknownFaces: UnknownFace[];
    phoneDetections: PhoneDetection[];
    appSettings: BackupSettingEntry[];
    absenceExcuses: BackupExcuseEntry[];
    misbehaviorReports: BackupMisbehaviorEntry[];
  };
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asBooleanString(value: boolean) {
  return value ? "true" : "false";
}

function parseFaceDescriptors(value: unknown): number[][] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value
    .filter((entry) => Array.isArray(entry))
    .map((entry) =>
      (entry as unknown[])
        .filter((point) => typeof point === "number" && Number.isFinite(point))
        .map((point) => Number(point)),
    )
    .filter((entry) => entry.length > 0);
  return normalized.length > 0 ? normalized : null;
}

export function exportSystemBackup(): SystemBackupPayload {
  const database = getDatabase();

  const studentRows = database
    .prepare(`
      SELECT
        id,
        student_code AS studentCode,
        full_name AS fullName,
        class_name AS className,
        face_descriptors AS faceDescriptors,
        photo_url AS photoUrl,
        lates_count AS latesCount,
        excuses_count AS excusesCount,
        break_lates_count AS breakLatesCount,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM students
      ORDER BY full_name COLLATE NOCASE ASC
    `)
    .all() as Record<string, unknown>[];

  const attendanceRows = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      ORDER BY captured_at ASC
    `)
    .all() as Record<string, unknown>[];

  const unknownFaces = database
    .prepare(`
      SELECT
        id,
        image_data AS imageData,
        detected_at AS detectedAt
      FROM unknown_faces
      ORDER BY detected_at ASC
    `)
    .all() as UnknownFace[];

  const phoneDetections = database
    .prepare(`
      SELECT
        id,
        image_data AS imageData,
        detected_at AS detectedAt
      FROM phone_detections
      ORDER BY detected_at ASC
    `)
    .all() as PhoneDetection[];

  const appSettings = database
    .prepare(`
      SELECT
        key,
        value
      FROM app_settings
      ORDER BY key ASC
    `)
    .all() as BackupSettingEntry[];

  const absenceExcuses = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        reason,
        excuse_date AS excuseDate,
        created_at AS createdAt
      FROM absence_excuses
      ORDER BY created_at ASC
    `)
    .all() as BackupExcuseEntry[];

  const misbehaviorReports = database
    .prepare(`
      SELECT
        id,
        student_id AS studentId,
        class_name_snapshot AS className,
        issue_type AS issueType,
        notes,
        reported_by AS reportedBy,
        reported_at AS reportedAt
      FROM misbehavior_reports
      ORDER BY reported_at ASC
    `)
    .all() as BackupMisbehaviorEntry[];

  return {
    version: 1,
    exportedAt: isoNow(),
    data: {
      students: studentRows.map(mapStudent),
      attendanceEvents: attendanceRows.map(mapAttendanceEvent),
      unknownFaces,
      phoneDetections,
      appSettings,
      absenceExcuses,
      misbehaviorReports,
    },
  };
}

export function restoreSystemBackup(payload: unknown) {
  if (!isObjectRecord(payload)) {
    throw new Error("Backup payload is invalid.");
  }

  const root = payload;
  const dataSource = isObjectRecord(root.data) ? root.data : root;
  const data = isObjectRecord(dataSource) ? dataSource : {};

  const rawStudents = Array.isArray(data.students) ? data.students : [];
  const rawAttendance = Array.isArray(data.attendanceEvents) ? data.attendanceEvents : [];
  const rawUnknownFaces = Array.isArray(data.unknownFaces) ? data.unknownFaces : [];
  const rawPhoneDetections = Array.isArray(data.phoneDetections) ? data.phoneDetections : [];
  const rawSettings = Array.isArray(data.appSettings) ? data.appSettings : [];
  const rawExcuses = Array.isArray(data.absenceExcuses) ? data.absenceExcuses : [];
  const rawMisbehaviorReports = Array.isArray(data.misbehaviorReports)
    ? data.misbehaviorReports
    : [];

  const students = rawStudents
    .filter(isObjectRecord)
    .map((student) => ({
      id: asString(student.id),
      studentCode: asString(student.studentCode).trim().toUpperCase(),
      fullName: asString(student.fullName).trim(),
      className: asNullableString(student.className),
      faceDescriptors: parseFaceDescriptors(student.faceDescriptors),
      photoUrl: asNullableString(student.photoUrl),
      latesCount: asNumber(student.latesCount),
      excusesCount: asNumber(student.excusesCount),
      breakLatesCount: asNumber(student.breakLatesCount),
      createdAt: asString(student.createdAt) || isoNow(),
      updatedAt: asString(student.updatedAt) || isoNow(),
    }))
    .filter((student) => student.id && student.studentCode && student.fullName);

  const studentIds = new Set(students.map((student) => student.id));

  const attendanceEvents = rawAttendance
    .filter(isObjectRecord)
    .map((event) => ({
      id: asString(event.id),
      studentId: asString(event.studentId),
      studentCodeSnapshot: asString(event.studentCodeSnapshot),
      fullNameSnapshot: asString(event.fullNameSnapshot),
      classNameSnapshot: asNullableString(event.classNameSnapshot),
      source: asString(event.source) || "manual_checkin",
      notes: asNullableString(event.notes),
      attendanceDate: asString(event.attendanceDate),
      capturedAt: asString(event.capturedAt) || isoNow(),
    }))
    .filter(
      (event) =>
        event.id &&
        event.studentId &&
        studentIds.has(event.studentId) &&
        event.studentCodeSnapshot &&
        event.fullNameSnapshot &&
        event.attendanceDate,
    );

  const unknownFaces = rawUnknownFaces
    .filter(isObjectRecord)
    .map((entry) => ({
      id: asString(entry.id),
      imageData: asString(entry.imageData),
      detectedAt: asString(entry.detectedAt) || isoNow(),
    }))
    .filter((entry) => entry.id && entry.imageData);

  const phoneDetections = rawPhoneDetections
    .filter(isObjectRecord)
    .map((entry) => ({
      id: asString(entry.id),
      imageData: asString(entry.imageData),
      detectedAt: asString(entry.detectedAt) || isoNow(),
    }))
    .filter((entry) => entry.id && entry.imageData);

  const appSettings = rawSettings
    .filter(isObjectRecord)
    .map((entry) => ({
      key: asString(entry.key),
      value: asString(entry.value),
    }))
    .filter((entry) => entry.key);

  const absenceExcuses = rawExcuses
    .filter(isObjectRecord)
    .map((entry) => ({
      id: asString(entry.id),
      studentId: asString(entry.studentId),
      reason: asString(entry.reason),
      excuseDate: asString(entry.excuseDate),
      createdAt: asString(entry.createdAt) || isoNow(),
    }))
    .filter(
      (entry) =>
        entry.id &&
        entry.studentId &&
        studentIds.has(entry.studentId) &&
        entry.reason &&
        entry.excuseDate,
    );

  const misbehaviorReports = rawMisbehaviorReports
    .filter(isObjectRecord)
    .map((entry) => ({
      id: asString(entry.id),
      studentId: asString(entry.studentId),
      className: asNullableString(entry.className),
      issueType: asString(entry.issueType),
      notes: asNullableString(entry.notes),
      reportedBy: asNullableString(entry.reportedBy),
      reportedAt: asString(entry.reportedAt) || isoNow(),
    }))
    .filter(
      (entry) =>
        entry.id &&
        entry.studentId &&
        studentIds.has(entry.studentId) &&
        entry.issueType,
    );

  const database = getDatabase();

  database.exec("BEGIN IMMEDIATE TRANSACTION;");

  try {
    database.prepare("DELETE FROM attendance_events").run();
    database.prepare("DELETE FROM absence_excuses").run();
    database.prepare("DELETE FROM misbehavior_reports").run();
    database.prepare("DELETE FROM unknown_faces").run();
    database.prepare("DELETE FROM phone_detections").run();
    database.prepare("DELETE FROM students").run();
    database.prepare("DELETE FROM app_settings").run();

    const insertStudent = database.prepare(`
      INSERT INTO students (
        id,
        student_code,
        full_name,
        class_name,
        face_descriptors,
        photo_url,
        lates_count,
        excuses_count,
        break_lates_count,
        created_at,
        updated_at
      ) VALUES (
        :id,
        :studentCode,
        :fullName,
        :className,
        :faceDescriptors,
        :photoUrl,
        :latesCount,
        :excusesCount,
        :breakLatesCount,
        :createdAt,
        :updatedAt
      )
    `);

    for (const student of students) {
      insertStudent.run({
        ...student,
        faceDescriptors: student.faceDescriptors
          ? JSON.stringify(student.faceDescriptors)
          : null,
      });
    }

    const insertAttendance = database.prepare(`
      INSERT INTO attendance_events (
        id,
        student_id,
        student_code_snapshot,
        full_name_snapshot,
        class_name_snapshot,
        source,
        notes,
        attendance_date,
        captured_at
      ) VALUES (
        :id,
        :studentId,
        :studentCodeSnapshot,
        :fullNameSnapshot,
        :classNameSnapshot,
        :source,
        :notes,
        :attendanceDate,
        :capturedAt
      )
    `);

    for (const event of attendanceEvents) {
      insertAttendance.run(event);
    }

    const insertUnknown = database.prepare(`
      INSERT INTO unknown_faces (id, image_data, detected_at)
      VALUES (:id, :imageData, :detectedAt)
    `);

    for (const face of unknownFaces) {
      insertUnknown.run(face);
    }

    const insertPhone = database.prepare(`
      INSERT INTO phone_detections (id, image_data, detected_at)
      VALUES (:id, :imageData, :detectedAt)
    `);

    for (const detection of phoneDetections) {
      insertPhone.run(detection);
    }

    const insertSetting = database.prepare(`
      INSERT INTO app_settings (key, value)
      VALUES (:key, :value)
    `);

    for (const setting of appSettings) {
      insertSetting.run(setting);
    }

    const settingsKeySet = new Set(appSettings.map((entry) => entry.key));
    const defaultSettings: BackupSettingEntry[] = [
      { key: "late_cutoff_minutes", value: "470" },
      { key: "check_in_open_minutes", value: "0" },
      { key: "check_in_close_minutes", value: "1439" },
      { key: "theme_preference", value: "light" },
      { key: "alerts_unknown_face_enabled", value: asBooleanString(true) },
      { key: "alerts_phone_detection_enabled", value: asBooleanString(true) },
      { key: "backup_interval", value: "weekly" },
    ];

    for (const fallbackSetting of defaultSettings) {
      if (!settingsKeySet.has(fallbackSetting.key)) {
        insertSetting.run(fallbackSetting);
      }
    }

    const insertExcuse = database.prepare(`
      INSERT INTO absence_excuses (
        id,
        student_id,
        reason,
        excuse_date,
        created_at
      ) VALUES (
        :id,
        :studentId,
        :reason,
        :excuseDate,
        :createdAt
      )
    `);

    for (const excuse of absenceExcuses) {
      insertExcuse.run(excuse);
    }

    const insertMisbehavior = database.prepare(`
      INSERT INTO misbehavior_reports (
        id,
        student_id,
        class_name_snapshot,
        issue_type,
        notes,
        reported_by,
        reported_at
      ) VALUES (
        :id,
        :studentId,
        :className,
        :issueType,
        :notes,
        :reportedBy,
        :reportedAt
      )
    `);

    for (const report of misbehaviorReports) {
      insertMisbehavior.run(report);
    }

    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
}
