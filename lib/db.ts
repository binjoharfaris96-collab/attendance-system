import "server-only";

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createClient, type Client } from "@libsql/client";

import {
  formatDateLabel,
  isoNow,
  minutesSinceMidnightFromIso,
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
  TodayAttendanceBreakdown,
  Announcement,
} from "@/lib/types";

type DatabaseGlobal = {
  database?: Client;
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
    userId: row.user_id ? String(row.user_id) : null,
    dateOfBirth: row.dateOfBirth ? String(row.dateOfBirth) : null,
    parentName: row.parentName ? String(row.parentName) : null,
    parentPhone: row.parentPhone ? String(row.parentPhone) : null,
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
    status: row.status ? String(row.status) : "present",
    scheduleId: row.schedule_id ? String(row.schedule_id) : null,
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

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    targetRole: String(row.targetRole ?? row.target_role ?? "all"),
    createdAt: String(row.createdAt ?? row.created_at),
  };
}

function mapStudentListItem(row: Record<string, unknown>): StudentListItem {
  return {
    ...mapStudent(row),
    attendanceCount: Number(row.attendanceCount ?? 0),
    lastAttendanceAt: row.lastAttendanceAt ? String(row.lastAttendanceAt) : null,
    userEmail: row.userEmail ? String(row.userEmail) : null,
  };
}

function getDatabaseConfig() {
  const isVercel = process.env.VERCEL === "1";
  const url = process.env.DATABASE_URL?.trim();
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

  if (url) {
    if (!/^(libsql:|https?:|wss?:|file:)/i.test(url)) {
      throw new Error(
        "DATABASE_URL must start with libsql:, https://, wss://, or file: (Turso/libSQL). " +
          "A bare hostname will not connect and signups will not persist.",
      );
    }
    return { url, authToken: authToken || undefined };
  }

  if (isVercel) {
    throw new Error(
      "DATABASE_URL is required on Vercel. Without a Turso (or other libSQL) URL, each " +
        "server instance uses a temporary database and new accounts are not saved.",
    );
  }

  const dataDirectory = join(process.cwd(), "data");
  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  return { url: `file:${join(dataDirectory, "attendance.sqlite")}` };
}

async function initializeDatabase(client: Client) {
  await client.batch([
    "PRAGMA foreign_keys = ON",
    `CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      class_name TEXT,
      face_descriptors TEXT,
      photo_url TEXT,
      lates_count INTEGER DEFAULT 0,
      excuses_count INTEGER DEFAULT 0,
      break_lates_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT,
      date_of_birth TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_events (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_code_snapshot TEXT NOT NULL,
      full_name_snapshot TEXT NOT NULL,
      class_name_snapshot TEXT,
      source TEXT NOT NULL,
      status TEXT DEFAULT 'Present',
      schedule_id TEXT,
      notes TEXT,
      attendance_date TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )`,
    "CREATE INDEX IF NOT EXISTS idx_attendance_events_student ON attendance_events(student_id, captured_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_attendance_events_date ON attendance_events(attendance_date, captured_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_attendance_events_schedule ON attendance_events(schedule_id, attendance_date)"
  ], "write");
}

export function getDatabase() {
  if (!globalForDatabase.database) {
    const config = getDatabaseConfig();
    globalForDatabase.database = createClient(config);
  }
  return globalForDatabase.database;
}

export async function ensureDatabaseReady() {
  const db = getDatabase();
  
  if (globalForDatabase.isReady) return db;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS misbehavior_reports (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_name_snapshot TEXT,
      issue_type TEXT NOT NULL,
      notes TEXT,
      reported_by TEXT,
      reported_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);
  await db.execute("CREATE INDEX IF NOT EXISTS idx_misbehavior_student ON misbehavior_reports(student_id, reported_at DESC)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_misbehavior_reported_at ON misbehavior_reports(reported_at DESC)");

  await initializeDatabase(db);

  // Add columns on existing DBs (must run after students table exists). Earlier runs failed silently when the table did not exist yet.
  try {
    await db.execute("ALTER TABLE students ADD COLUMN face_descriptors TEXT");
  } catch {
    /* duplicate column or unsupported */
  }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN lates_count INTEGER DEFAULT 0");
  } catch {
    /* duplicate column or unsupported */
  }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN excuses_count INTEGER DEFAULT 0");
  } catch {
    /* duplicate column or unsupported */
  }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN break_lates_count INTEGER DEFAULT 0");
  } catch {
    /* duplicate column or unsupported */
  }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN photo_url TEXT");
  } catch { /* duplicate */ }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL");
  } catch { /* duplicate */ }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN date_of_birth TEXT");
  } catch { /* duplicate */ }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN parent_name TEXT");
  } catch { /* duplicate */ }
  try {
    await db.execute("ALTER TABLE students ADD COLUMN parent_phone TEXT");
  } catch { /* duplicate */ }

  await db.execute(`CREATE TABLE IF NOT EXISTS unknown_faces (id TEXT PRIMARY KEY, image_data TEXT NOT NULL, detected_at TEXT NOT NULL)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS phone_detections (id TEXT PRIMARY KEY, image_data TEXT NOT NULL, detected_at TEXT NOT NULL)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS absence_excuses (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    excuse_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
  )`);
  
  // Phase 1 ManageBac Upgrades
  try {
    await db.execute("ALTER TABLE students ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL");
  } catch {
    /* duplicate column or unsupported */
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      department TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      subject TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS class_students (
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      PRIMARY KEY (class_id, student_id),
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      file_url TEXT,
      status TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL UNIQUE,
      score REAL,
      feedback TEXT,
      graded_at TEXT NOT NULL,
      FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE
    )
  `);

  await db.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('late_cutoff_minutes', '470')");
  
  globalForDatabase.isReady = true;
  return db;
}

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT
        id,
        email,
        password_hash AS passwordHash,
        full_name AS fullName,
        role,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE email = :email
      LIMIT 1
    `,
    args: { email: email.toLowerCase().trim() }
  });

  const row = rs.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.passwordHash),
    fullName: String(row.fullName),
    role: String(row.role),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: string;
}) {
  const database = await ensureDatabaseReady();
  const now = isoNow();

  const user: DbUser = {
    id: randomUUID(),
    email: input.email.toLowerCase().trim(),
    passwordHash: input.passwordHash,
    fullName: input.fullName.trim(),
    role: input.role || "admin",
    createdAt: now,
    updatedAt: now,
  };

  await database.execute({
    sql: `
      INSERT INTO users (
        id,
        email,
        password_hash,
        full_name,
        role,
        created_at,
        updated_at
      ) VALUES (
        :id,
        :email,
        :passwordHash,
        :fullName,
        :role,
        :createdAt,
        :updatedAt
      )
    `,
    args: {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });

  return user;
}

function normalizeStudentCode(value: string) {
  return value.trim().toUpperCase();
}

function sanitizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function listStudents() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`
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
    `);

  return rs.rows.map((row) => mapStudentListItem(row as unknown as Record<string, unknown>));
}



export async function getStudentById(studentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
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
    `,
    args: { studentId }
  });

  const row = rs.rows[0];
  return row ? mapStudent(row as unknown as Record<string, unknown>) : null;
}

export async function createStudent(input: {
  studentCode: string;
  fullName: string;
  className?: string | null;
  faceDescriptors?: number[][] | null;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
}) {
  const database = await ensureDatabaseReady();
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
    dateOfBirth: sanitizeOptional(input.dateOfBirth),
    parentName: sanitizeOptional(input.parentName),
    parentPhone: sanitizeOptional(input.parentPhone),
  };

  await database.execute({
    sql: `
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
        updated_at,
        date_of_birth,
        parent_name,
        parent_phone
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
        :updatedAt,
        :dateOfBirth,
        :parentName,
        :parentPhone
      )
    `,
    args: {
      ...student,
      faceDescriptors: student.faceDescriptors
        ? JSON.stringify(student.faceDescriptors)
        : null,
    } as any
  });

  return student;
}

export async function updateStudent(
  studentId: string,
  input: {
    studentCode: string;
    fullName: string;
    className?: string | null;
    faceDescriptors?: number[][] | null;
    photoUrl?: string | null;
    dateOfBirth?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
  },
) {
  const database = await ensureDatabaseReady();
  const current = await getStudentById(studentId);

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
    dateOfBirth: input.dateOfBirth !== undefined ? sanitizeOptional(input.dateOfBirth) : current.dateOfBirth,
    parentName: input.parentName !== undefined ? sanitizeOptional(input.parentName) : current.parentName,
    parentPhone: input.parentPhone !== undefined ? sanitizeOptional(input.parentPhone) : current.parentPhone,
    updatedAt: isoNow(),
  };

  await database.execute({
    sql: `
      UPDATE students
      SET
        student_code = :studentCode,
        full_name = :fullName,
        class_name = :className,
        face_descriptors = :faceDescriptors,
        photo_url = :photoUrl,
        date_of_birth = :dateOfBirth,
        parent_name = :parentName,
        parent_phone = :parentPhone,
        updated_at = :updatedAt
      WHERE id = :id
    `,
    args: {
      ...updatedStudent,
      faceDescriptors: updatedStudent.faceDescriptors ? JSON.stringify(updatedStudent.faceDescriptors) : null,
    } as any
  });

  return updatedStudent;
}

export async function deleteStudent(studentId: string) {
  const database = await ensureDatabaseReady();
  const current = await getStudentById(studentId);

  if (!current) {
    throw new Error("Student not found.");
  }

  await database.batch([
    { sql: `DELETE FROM attendance_events WHERE student_id = ?`, args: [studentId] },
    { sql: `DELETE FROM students WHERE id = ?`, args: [studentId] }
  ], "write");

  return true;
}

export async function listRecentAttendance(limit = 12) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT
        id,
        student_id AS studentId,
        student_code_snapshot AS studentCodeSnapshot,
        full_name_snapshot AS fullNameSnapshot,
        class_name_snapshot AS classNameSnapshot,
        source,
        status,
        schedule_id AS scheduleId,
        notes,
        attendance_date AS attendanceDate,
        captured_at AS capturedAt
      FROM attendance_events
      ORDER BY captured_at DESC
      LIMIT :limit
    `,
    args: { limit }
  });

  return rs.rows.map((row) => mapAttendanceEvent(row as unknown as Record<string, unknown>));
}

export async function listAttendanceForStudent(studentId: string, limit = 20) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
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
    `,
    args: { studentId, limit }
  });

  return rs.rows.map((row) => mapAttendanceEvent(row as unknown as Record<string, unknown>));
}

export async function listAttendanceReport(limit = 200, date?: string | null) {
  const database = await ensureDatabaseReady();

  if (date) {
    const rs = await database.execute({
      sql: `
        SELECT
          id,
          student_id AS studentId,
          student_code_snapshot AS studentCodeSnapshot,
          full_name_snapshot AS fullNameSnapshot,
          class_name_snapshot AS classNameSnapshot,
          source,
          status,
          schedule_id AS scheduleId,
          notes,
          attendance_date AS attendanceDate,
          captured_at AS capturedAt
        FROM attendance_events
        WHERE attendance_date = :date
        ORDER BY captured_at DESC
        LIMIT :limit
      `,
      args: { date, limit }
    });

    return rs.rows.map((row) => mapAttendanceEvent(row as unknown as Record<string, unknown>));
  }

  return listRecentAttendance(limit);
}

export async function getDashboardSummary() {
  const database = await ensureDatabaseReady();
  const today = toAttendanceDate(isoNow());
  const sevenDaysAgo = shiftDate(today, -6);

  const rsTotal = await database.execute(`SELECT COUNT(*) AS total FROM students`);
  const totalStudents = Number(rsTotal.rows[0]?.total ?? 0);

  const rsClasses = await database.execute(`SELECT COUNT(*) AS total FROM classes`);
  const totalClasses = Number(rsClasses.rows[0]?.total ?? 0);

  const rsToday = await database.execute({
    sql: `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date = :today`,
    args: { today }
  });
  const todayAttendance = Number(rsToday.rows[0]?.total ?? 0);

  const rsLast7 = await database.execute({
    sql: `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date >= :sevenDaysAgo`,
    args: { sevenDaysAgo }
  });
  const attendanceLast7Days = Number(rsLast7.rows[0]?.total ?? 0);

  const summary = {
    totalStudents: Number(totalStudents),
    todayAttendance: Number(todayAttendance),
    attendanceLast7Days: Number(attendanceLast7Days),
    totalClasses: Number(totalClasses)
  };

  return summary;
}

export async function getLatestAnnouncements(role: string, limit: number): Promise<Announcement[]> {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT
        id,
        title,
        content,
        target_role AS targetRole,
        created_at AS createdAt
      FROM announcements
      WHERE target_role = 'all' OR target_role = :role
      ORDER BY created_at DESC
      LIMIT :limit
    `,
    args: { role, limit }
  });

  return rs.rows.map((row) => mapAnnouncement(row as unknown as Record<string, unknown>));
}

export async function getTodayAttendanceBreakdown(): Promise<TodayAttendanceBreakdown> {
  const database = await ensureDatabaseReady();
  const today = toAttendanceDate(isoNow());
  const lateCutoffMinutes = parseInt(
    await getSetting("late_cutoff_minutes", "470"),
    10,
  );

  const rsTotal = await database.execute(`SELECT COUNT(*) AS total FROM students`);
  const totalStudents = Number(rsTotal.rows[0]?.total ?? 0);

  const rsEvents = await database.execute({
    sql: `
      SELECT captured_at AS capturedAt
      FROM attendance_events
      WHERE attendance_date = :today
    `,
    args: { today },
  });

  let onTime = 0;
  let late = 0;

  for (const row of rsEvents.rows) {
    const capturedAt = String(row.capturedAt ?? "");
    const mins = minutesSinceMidnightFromIso(capturedAt);
    if (mins > lateCutoffMinutes) {
      late += 1;
    } else {
      onTime += 1;
    }
  }

  const checkedIn = onTime + late;
  const absent = Math.max(0, totalStudents - checkedIn);

  return { totalStudents, onTime, late, absent };
}

export async function getDailyAttendanceCounts(days = 7) {
  const database = await ensureDatabaseReady();
  const today = toAttendanceDate(isoNow());
  const start = shiftDate(today, days * -1 + 1);

  const rs = await database.execute({
    sql: `
      SELECT attendance_date AS day, COUNT(*) AS total
      FROM attendance_events
      WHERE attendance_date >= :start
      GROUP BY attendance_date
      ORDER BY attendance_date ASC
    `,
    args: { start }
  });

  const countsByDay = new Map(
    rs.rows.map((row) => [String(row.day), Number(row.total ?? 0)]),
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

export async function getRosterSnapshot() {
  const students = await listStudents();
  const summary = await getDashboardSummary();
  const dailyCounts = await getDailyAttendanceCounts(7);
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

export async function recordAttendanceByStudentCode(input: {
  studentCode: string;
  notes?: string | null;
  source?: string;
}) {
  const database = await ensureDatabaseReady();
  const studentCode = normalizeStudentCode(input.studentCode);
  const rsStudent = await database.execute({
    sql: `
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
    `,
    args: { studentCode }
  });

  const student = rsStudent.rows[0];

  if (!student) {
    return {
      status: "missing" as const,
      message: `No student was found for ID ${studentCode}.`,
    };
  }

  const mappedStudent = mapStudent(student as unknown as Record<string, unknown>);
  const capturedAt = isoNow();
  const attendanceDate = toAttendanceDate(capturedAt);

  const rsDup = await database.execute({
    sql: `
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
    `,
    args: {
      studentId: mappedStudent.id,
      attendanceDate,
    }
  });

  const duplicate = rsDup.rows[0];

  if (duplicate) {
    const existing = mapAttendanceEvent(duplicate as unknown as Record<string, unknown>);

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
  const openTimeMinutes = parseInt(await getSetting("check_in_open_minutes", "0"), 10);
  const closeTimeMinutes = parseInt(await getSetting("check_in_close_minutes", "1439"), 10);

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

  const lateCutoffMinutes = parseInt(await getSetting("late_cutoff_minutes", "DEFAULT"), 10);
  const status = minutesSinceMidnight > lateCutoffMinutes ? "late" : "present";

  const event: AttendanceEvent = {
    id: randomUUID(),
    studentId: mappedStudent.id,
    studentCodeSnapshot: mappedStudent.studentCode,
    fullNameSnapshot: mappedStudent.fullName,
    classNameSnapshot: mappedStudent.className,
    source: input.source?.trim() || "manual_checkin",
    status,
    scheduleId: null,
    notes: sanitizeOptional(input.notes),
    attendanceDate,
    capturedAt,
  };

  await database.execute({
    sql: `
      INSERT INTO attendance_events (
        id,
        student_id,
        student_code_snapshot,
        full_name_snapshot,
        class_name_snapshot,
        source,
        status,
        schedule_id,
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
        :status,
        :scheduleId,
        :notes,
        :attendanceDate,
        :capturedAt
      )
    `,
    args: event as any
  });

  // Use existing lateCutoffMinutes from above

  if (minutesSinceMidnight > lateCutoffMinutes) {
    await database.execute({
      sql: `
        UPDATE students
        SET lates_count = IFNULL(lates_count, 0) + 1,
            updated_at = :updatedAt
        WHERE id = :id
      `,
      args: {
        id: mappedStudent.id,
        updatedAt: capturedAt,
      }
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

export async function recordUnknownFace(base64Image: string) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const detectedAt = isoNow();

  await database.execute({
    sql: `
      INSERT INTO unknown_faces (id, image_data, detected_at)
      VALUES (?, ?, ?)
    `,
    args: [id, base64Image, detectedAt]
  });

  return { id, detectedAt };
}

export async function listUnknownFaces(limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT 
        id, 
        image_data AS imageData, 
        detected_at AS detectedAt
      FROM unknown_faces
      ORDER BY detected_at DESC
      LIMIT ?
    `,
    args: [limit]
  });
  return rs.rows as unknown as UnknownFace[];
}

export async function clearUnknownFaces() {
  const database = await ensureDatabaseReady();
  await database.execute(`DELETE FROM unknown_faces`);
  return true;
}

export async function countUnknownFaces() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`SELECT COUNT(*) as count FROM unknown_faces`);
  return Number(rs.rows[0]?.count ?? 0);
}

export type PhoneDetection = {
  id: string;
  imageData: string;
  detectedAt: string;
};

export async function recordPhoneDetection(base64Image: string) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const detectedAt = isoNow();

  await database.execute({
    sql: `
      INSERT INTO phone_detections (id, image_data, detected_at)
      VALUES (?, ?, ?)
    `,
    args: [id, base64Image, detectedAt]
  });

  return { id, detectedAt };
}

export async function listPhoneDetections(limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT 
        id, 
        image_data AS imageData, 
        detected_at AS detectedAt
      FROM phone_detections
      ORDER BY detected_at DESC
      LIMIT ?
    `,
    args: [limit]
  });
  return rs.rows as unknown as PhoneDetection[];
}

export async function clearPhoneDetections() {
  const database = await ensureDatabaseReady();
  await database.execute(`DELETE FROM phone_detections`);
  return true;
}

export async function countPhoneDetections() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`SELECT COUNT(*) as count FROM phone_detections`);
  return Number(rs.rows[0]?.count ?? 0);
}

export async function updateStudentDisciplinaryCount(studentId: string, eventType: "late" | "excused" | "break_late", amount: number) {
  const database = await ensureDatabaseReady();
  const current = await getStudentById(studentId);

  if (!current) {
    throw new Error("Student not found.");
  }

  let columnToUpdate = "";
  if (eventType === "late") columnToUpdate = "lates_count";
  if (eventType === "excused") columnToUpdate = "excuses_count";
  if (eventType === "break_late") columnToUpdate = "break_lates_count";

  if (!columnToUpdate) throw new Error("Invalid event type.");

  await database.execute({
    sql: `
      UPDATE students
      SET ${columnToUpdate} = MAX(0, IFNULL(${columnToUpdate}, 0) + :amount),
          updated_at = :updatedAt
      WHERE id = :id
    `,
    args: {
      id: studentId,
      updatedAt: isoNow(),
      amount,
    }
  });

  return true;
}

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT value FROM app_settings WHERE key = ?`,
    args: [key]
  });
  const row = rs.rows[0];
  return row ? String(row.value) : defaultValue;
}

export async function updateSetting(key: string, value: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `
      INSERT INTO app_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    args: [key, value]
  });
  return true;
}

export async function createMisbehaviorReport(input: {
  studentId: string;
  className?: string | null;
  issueType: string;
  notes?: string | null;
  reportedBy?: string | null;
}) {
  const database = await ensureDatabaseReady();
  const student = await getStudentById(input.studentId);

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

  await database.execute({
    sql: `
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
    `,
    args: report as any
  });

  return report;
}

export async function listRecentMisbehaviorReports(limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
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
    `,
    args: [limit]
  });

  return rs.rows.map((row) => mapMisbehaviorReport(row as unknown as Record<string, unknown>));
}

export async function listMisbehaviorReportsForStudent(studentId: string, limit = 30) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
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
    `,
    args: { studentId, limit }
  });

  return rs.rows.map((row) => mapMisbehaviorReport(row as unknown as Record<string, unknown>));
}

export type Excuse = {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  excuseDate: string;
  createdAt: string;
};

export async function createExcuse(studentId: string, reason: string, excuseDate: string) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();

  // Deduct 1 from lates_count and add 1 to excuses_count
  await database.batch([
    {
      sql: `
        UPDATE students
        SET lates_count = MAX(0, IFNULL(lates_count, 0) - 1),
            excuses_count = IFNULL(excuses_count, 0) + 1,
            updated_at = :updatedAt
        WHERE id = :id
      `,
      args: { id: studentId, updatedAt: now }
    },
    {
      sql: `INSERT INTO absence_excuses (id, student_id, reason, excuse_date, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [id, studentId, reason.trim(), excuseDate, now]
    }
  ], "write");

  return true;
}

export async function listExcuses(limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
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
    `,
    args: [limit]
  });
  return rs.rows as unknown as Excuse[];
}

export async function deleteExcuse(id: string) {
  const database = await ensureDatabaseReady();
  // Fetch excuse to find owner
  const rs = await database.execute({
    sql: `SELECT student_id FROM absence_excuses WHERE id = ?`,
    args: [id]
  });
  const excuse = rs.rows[0];
  if (!excuse) return false;

  const studentId = String(excuse.student_id);

  await database.batch([
    {
      sql: `
        UPDATE students
        SET lates_count = IFNULL(lates_count, 0) + 1,
            excuses_count = MAX(0, IFNULL(excuses_count, 0) - 1),
            updated_at = :updatedAt
        WHERE id = :studentId
      `,
      args: { studentId, updatedAt: isoNow() }
    },
    {
      sql: `DELETE FROM absence_excuses WHERE id = ?`,
      args: [id]
    }
  ], "write");

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

export async function exportSystemBackup(): Promise<SystemBackupPayload> {
  const database = await ensureDatabaseReady();

  const [
    studentRs,
    attendanceRs,
    unknownFacesRs,
    phoneDetectionsRs,
    appSettingsRs,
    absenceExcusesRs,
    misbehaviorReportsRs
  ] = await Promise.all([
    database.execute(`
      SELECT id, student_code AS studentCode, full_name AS fullName, class_name AS className, 
             face_descriptors AS faceDescriptors, photo_url AS photoUrl, 
             lates_count AS latesCount, excuses_count AS excusesCount, 
             break_lates_count AS breakLatesCount, created_at AS createdAt, updated_at AS updatedAt
      FROM students ORDER BY full_name COLLATE NOCASE ASC
    `),
    database.execute(`
      SELECT id, student_id AS studentId, student_code_snapshot AS studentCodeSnapshot, 
             full_name_snapshot AS fullNameSnapshot, class_name_snapshot AS classNameSnapshot, 
             source, status, schedule_id AS scheduleId, notes, attendance_date AS attendanceDate, captured_at AS capturedAt
      FROM attendance_events ORDER BY captured_at ASC
    `),
    database.execute(`SELECT id, image_data AS imageData, detected_at AS detectedAt FROM unknown_faces ORDER BY detected_at ASC`),
    database.execute(`SELECT id, image_data AS imageData, detected_at AS detectedAt FROM phone_detections ORDER BY detected_at ASC`),
    database.execute(`SELECT key, value FROM app_settings ORDER BY key ASC`),
    database.execute(`SELECT id, student_id AS studentId, reason, excuse_date AS excuseDate, created_at AS createdAt FROM absence_excuses ORDER BY created_at ASC`),
    database.execute(`SELECT id, student_id AS studentId, class_name_snapshot AS className, issue_type AS issueType, notes, reported_by AS reportedBy, reported_at AS reportedAt FROM misbehavior_reports ORDER BY reported_at ASC`)
  ]);

  return {
    version: 1,
    exportedAt: isoNow(),
    data: {
      students: studentRs.rows.map((r) => mapStudent(r as unknown as Record<string, unknown>)),
      attendanceEvents: attendanceRs.rows.map((r) => mapAttendanceEvent(r as unknown as Record<string, unknown>)),
      unknownFaces: unknownFacesRs.rows as unknown as UnknownFace[],
      phoneDetections: phoneDetectionsRs.rows as unknown as PhoneDetection[],
      appSettings: appSettingsRs.rows as unknown as BackupSettingEntry[],
      absenceExcuses: absenceExcusesRs.rows as unknown as BackupExcuseEntry[],
      misbehaviorReports: misbehaviorReportsRs.rows as unknown as BackupMisbehaviorEntry[],
    },
  };
}

export async function restoreSystemBackup(payload: unknown) {
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
      status: asString(event.status) || "present",
      scheduleId: asNullableString(event.scheduleId),
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

  const database = await ensureDatabaseReady();

  const ops: { sql: string; args?: any[] | Record<string, any> }[] = [
    { sql: "DELETE FROM attendance_events" },
    { sql: "DELETE FROM absence_excuses" },
    { sql: "DELETE FROM misbehavior_reports" },
    { sql: "DELETE FROM unknown_faces" },
    { sql: "DELETE FROM phone_detections" },
    { sql: "DELETE FROM students" },
    { sql: "DELETE FROM app_settings" }
  ];

  for (const student of students) {
    ops.push({
      sql: `INSERT INTO students (id, student_code, full_name, class_name, face_descriptors, photo_url, lates_count, excuses_count, break_lates_count, created_at, updated_at) VALUES (:id, :studentCode, :fullName, :className, :faceDescriptors, :photoUrl, :latesCount, :excusesCount, :breakLatesCount, :createdAt, :updatedAt)`,
      args: { ...student, faceDescriptors: student.faceDescriptors ? JSON.stringify(student.faceDescriptors) : null }
    });
  }

  for (const event of attendanceEvents) {
    ops.push({
      sql: `INSERT INTO attendance_events (id, student_id, student_code_snapshot, full_name_snapshot, class_name_snapshot, source, status, schedule_id, notes, attendance_date, captured_at) VALUES (:id, :studentId, :studentCodeSnapshot, :fullNameSnapshot, :classNameSnapshot, :source, :status, :scheduleId, :notes, :attendanceDate, :capturedAt)`,
      args: event
    });
  }

  for (const face of unknownFaces) {
    ops.push({ sql: `INSERT INTO unknown_faces (id, image_data, detected_at) VALUES (:id, :imageData, :detectedAt)`, args: face });
  }

  for (const detection of phoneDetections) {
    ops.push({ sql: `INSERT INTO phone_detections (id, image_data, detected_at) VALUES (:id, :imageData, :detectedAt)`, args: detection });
  }

  for (const setting of appSettings) {
    ops.push({ sql: `INSERT INTO app_settings (key, value) VALUES (:key, :value)`, args: setting });
  }

  const settingsKeySet = new Set(appSettings.map((entry) => entry.key));
  const defaultSettings = [
    { key: "late_cutoff_minutes", value: "470" },
    { key: "check_in_open_minutes", value: "0" },
    { key: "check_in_close_minutes", value: "1439" },
    { key: "theme_preference", value: "light" },
    { key: "alerts_unknown_face_enabled", value: asBooleanString(true) },
    { key: "alerts_phone_detection_enabled", value: asBooleanString(true) },
    { key: "backup_interval", value: "weekly" },
  ];

  for (const fallback of defaultSettings) {
    if (!settingsKeySet.has(fallback.key)) {
      ops.push({ sql: `INSERT INTO app_settings (key, value) VALUES (:key, :value)`, args: fallback });
    }
  }

  for (const excuse of absenceExcuses) {
    ops.push({ sql: `INSERT INTO absence_excuses (id, student_id, reason, excuse_date, created_at) VALUES (:id, :studentId, :reason, :excuseDate, :createdAt)`, args: excuse });
  }

  for (const report of misbehaviorReports) {
    ops.push({ sql: `INSERT INTO misbehavior_reports (id, student_id, class_name_snapshot, issue_type, notes, reported_by, reported_at) VALUES (:id, :studentId, :className, :issueType, :notes, :reportedBy, :reportedAt)`, args: report });
  }

  await database.batch(ops, "write");
}

/* 
 * -------------------------------------------------------------
 * Phase 2 - Student Portal Methods
 * -------------------------------------------------------------
 */

export async function getStudentByUserId(userId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
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
      WHERE user_id = :userId
      LIMIT 1
    `,
    args: { userId }
  });

  const row = rs.rows[0];
  return row ? mapStudent(row as unknown as Record<string, unknown>) : null;
}

export async function getStudentAttendanceSummary(studentId: string) {
  const database = await ensureDatabaseReady();
  // Fetch their total recorded terms vs checked-in days. 
  // For simplicity derived from existing tables, we check distinct days they checked in.
  
  const rsDays = await database.execute(`SELECT COUNT(DISTINCT attendance_date) AS active_days FROM attendance_events`);
  const totalSchoolDays = Number(rsDays.rows[0]?.active_days || 0) || 1; // avoid / 0

  const rsEvents = await database.execute({
    sql: `SELECT COUNT(DISTINCT attendance_date) AS present_days FROM attendance_events WHERE student_id = :studentId`,
    args: { studentId }
  });
  const presentDays = Number(rsEvents.rows[0]?.present_days || 0);

  const percentage = Math.round((presentDays / totalSchoolDays) * 100);

  return { totalSchoolDays, presentDays, percentage };
}

export async function getStudentAssignments(studentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT 
        a.id, 
        a.title, 
        a.description, 
        a.due_date AS dueDate, 
        c.name AS className,
        s.status,
        s.score
      FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      JOIN assignments a ON a.class_id = c.id
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = :studentId
      WHERE cs.student_id = :studentId
      ORDER BY a.due_date ASC
    `,
    args: { studentId }
  });

  return rs.rows.map(row => ({
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    dueDate: String(row.dueDate),
    className: String(row.className),
    status: row.status ? String(row.status) : "Not Submitted",
    score: row.score ? Number(row.score) : null
  }));
}

export async function getStudentAttendanceEvents(studentId: string, limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT 
        id, 
        attendance_date AS attendanceDate, 
        captured_at AS capturedAt,
        source,
        status,
        schedule_id AS scheduleId,
        notes
      FROM attendance_events
      WHERE student_id = :studentId
      ORDER BY captured_at DESC
      LIMIT :limit
    `,
    args: { studentId, limit }
  });

  return rs.rows.map(row => ({
    id: String(row.id),
    attendanceDate: String(row.attendanceDate),
    capturedAt: String(row.capturedAt),
    source: String(row.source),
    status: row.status ? String(row.status) : "present",
    scheduleId: row.scheduleId ? String(row.scheduleId) : null,
    notes: row.notes ? String(row.notes) : null
  }));
}

/* 
 * -------------------------------------------------------------
 * Phase 3 - Teacher Portal Methods
 * -------------------------------------------------------------
 */

export async function getTeacherByUserId(userId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT id, user_id AS userId, full_name AS fullName, department
      FROM teachers
      WHERE user_id = :userId
      LIMIT 1
    `,
    args: { userId }
  });

  const row = rs.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    userId: String(row.userId),
    fullName: String(row.fullName),
    department: row.department ? String(row.department) : null
  };
}



export async function getTeacherClasses(teacherId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT 
        c.id, c.name, c.subject,
        (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS studentCount
      FROM classes c
      WHERE c.teacher_id = :teacherId
      ORDER BY c.name ASC
    `,
    args: { teacherId }
  });

  return rs.rows.map(row => ({
    id: String(row.id),
    name: String(row.name),
    subject: row.subject ? String(row.subject) : null,
    studentCount: Number(row.studentCount)
  }));
}

export async function getTeacherAssignments(teacherId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT 
        a.id, a.title, a.due_date AS dueDate, c.name AS className,
        (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = a.class_id) AS totalStudents,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'Submitted') AS submittedCount
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      WHERE c.teacher_id = :teacherId
      ORDER BY a.due_date DESC
    `,
    args: { teacherId }
  });

  return rs.rows.map(row => ({
    id: String(row.id),
    title: String(row.title),
    dueDate: String(row.dueDate),
    className: String(row.className),
    totalStudents: Number(row.totalStudents),
    submittedCount: Number(row.submittedCount)
  }));
}

export async function insertAssignment(classId: string, title: string, description: string, dueDate: string) {
  const database = await ensureDatabaseReady();
  const { randomUUID } = await import("node:crypto");
  const id = randomUUID();
  const now = new Date().toISOString();

  await database.execute({
    sql: `
      INSERT INTO assignments (id, class_id, title, description, due_date, created_at, updated_at)
      VALUES (:id, :classId, :title, :description, :dueDate, :now, :now)
    `,
    args: { id, classId, title, description, dueDate, now }
  });

  return id;
}


/* 
 * -------------------------------------------------------------
 * Phase 4 - Admin & Communication Methods
 * -------------------------------------------------------------
 */

export async function getUnlinkedUsers(role: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT id, email, full_name AS fullName, role
      FROM users
      WHERE role = :role
      AND id NOT IN (SELECT user_id FROM students WHERE user_id IS NOT NULL)
      AND id NOT IN (SELECT user_id FROM teachers WHERE user_id IS NOT NULL)
      ORDER BY email ASC
    `,
    args: { role }
  });

  return rs.rows.map(row => ({
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.fullName),
    role: String(row.role)
  }));
}

export async function updateStudentUserId(studentId: string, userId: string | null) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `UPDATE students SET user_id = :userId, updated_at = :now WHERE id = :studentId`,
    args: { userId, studentId, now: isoNow() }
  });
}

export async function updateTeacherUserId(teacherId: string, userId: string | null) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `UPDATE teachers SET user_id = :userId, updated_at = :now WHERE id = :teacherId`,
    args: { userId, teacherId, now: isoNow() }
  });
}

export async function listTeachers() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`
    SELECT t.id, t.full_name AS fullName, t.department, t.user_id AS userId, u.email AS userEmail,
      (SELECT COUNT(*) FROM classes c WHERE c.teacher_id = t.id) AS classesCount
    FROM teachers t
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.full_name ASC
  `);
  
  return rs.rows.map(row => ({
    id: String(row.id),
    fullName: String(row.fullName),
    department: row.department ? String(row.department) : null,
    userId: row.userId ? String(row.userId) : null,
    userEmail: row.userEmail ? String(row.userEmail) : null,
    classesCount: Number(row.classesCount)
  }));
}

export async function getTeacherById(id: string) {
  if (!id) return null;
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT id, full_name AS fullName, department, user_id AS userId FROM teachers WHERE id = :id`,
    args: { id }
  });
  const row = rs.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    fullName: String(row.fullName),
    department: row.department ? String(row.department) : null,
    userId: row.userId ? String(row.userId) : null
  };
}

export async function createTeacher(data: { fullName: string, department?: string }) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `INSERT INTO teachers (id, full_name, department, created_at, updated_at) VALUES (:id, :fullName, :department, :now, :now)`,
    args: { id, fullName: data.fullName, department: data.department || null, now }
  });
  return id;
}

export async function deleteTeacher(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `DELETE FROM teachers WHERE id = :id`,
    args: { id }
  });
}

export async function createAnnouncement(title: string, content: string, targetRole: string) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `INSERT INTO announcements (id, title, content, target_role, created_at) VALUES (:id, :title, :content, :targetRole, :now)`,
    args: { id, title, content, targetRole, now }
  });
  return id;
}


export async function listAllAnnouncements() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`SELECT id, title, content, target_role AS targetRole, created_at AS createdAt FROM announcements ORDER BY created_at DESC`);
  return rs.rows.map(row => mapAnnouncement(row as unknown as Record<string, unknown>));
}

export async function deleteAnnouncement(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `DELETE FROM announcements WHERE id = :id`,
    args: { id }
  });
}

/* 
 * -------------------------------------------------------------
 * Phase 5 - Class Management & Enrollment
 * -------------------------------------------------------------
 */

export async function listAllClasses() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`
    SELECT 
      c.id, c.name, c.subject, c.created_at AS createdAt,
      t.full_name AS teacherName,
      (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS studentCount
    FROM classes c
    JOIN teachers t ON t.id = c.teacher_id
    ORDER BY c.name ASC
  `);

  return rs.rows.map(row => ({
    id: String(row.id),
    name: String(row.name),
    subject: row.subject ? String(row.subject) : null,
    teacherName: String(row.teacherName),
    studentCount: Number(row.studentCount),
    createdAt: String(row.createdAt)
  }));
}

export async function getClassWithRoster(classId: string) {
  const database = await ensureDatabaseReady();
  
  const rsClass = await database.execute({
    sql: `
      SELECT c.*, t.full_name AS teacherName
      FROM classes c
      JOIN teachers t ON t.id = c.teacher_id
      WHERE c.id = :classId
    `,
    args: { classId }
  });

  const classData = rsClass.rows[0];
  if (!classData) return null;

  const rsRoster = await database.execute({
    sql: `
      SELECT s.*
      FROM students s
      JOIN class_students cs ON cs.student_id = s.id
      WHERE cs.class_id = :classId
      ORDER BY s.full_name ASC
    `,
    args: { classId }
  });

  return {
    id: String(classData.id),
    name: String(classData.name),
    subject: classData.subject ? String(classData.subject) : null,
    teacherId: String(classData.teacher_id),
    teacherName: String(classData.teacherName),
    students: rsRoster.rows.map(row => mapStudent(row as unknown as Record<string, unknown>))
  };
}

export async function enrollStudentInClass(studentId: string, classId: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `INSERT OR IGNORE INTO class_students (class_id, student_id) VALUES (:classId, :studentId)`,
    args: { classId, studentId }
  });
}

export async function unenrollStudentFromClass(studentId: string, classId: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `DELETE FROM class_students WHERE class_id = :classId AND student_id = :studentId`,
    args: { classId, studentId }
  });
}

export async function createClass(input: { name: string; teacherId: string; subject?: string }) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `INSERT INTO classes (id, name, teacher_id, subject, created_at, updated_at) VALUES (:id, :name, :teacherId, :subject, :now, :now)`,
    args: { id, name: input.name, teacherId: input.teacherId, subject: input.subject || null, now }
  });
  return id;
}

export async function deleteClass(classId: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `DELETE FROM classes WHERE id = :classId`,
    args: { classId }
  });
}

export async function updateClassTeacher(classId: string, teacherId: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `UPDATE classes SET teacher_id = :teacherId, updated_at = :now WHERE id = :classId`,
    args: { classId, teacherId, now: isoNow() }
  });
}
/* 
 * -------------------------------------------------------------
 * Phase 6 - Reporting & Analytics
 * -------------------------------------------------------------
 */

export async function getSchoolwideStats() {
  const database = await ensureDatabaseReady();
  
  const rsPresence = await database.execute(`
    SELECT 
      attendance_date, 
      COUNT(*) as count 
    FROM attendance_events 
    GROUP BY attendance_date 
    ORDER BY attendance_date DESC 
    LIMIT 14
  `);

  const rsClasses = await database.execute(`
    SELECT 
      c.name,
      (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as total,
      (SELECT COUNT(DISTINCT student_id) FROM attendance_events ae 
       JOIN class_students cs ON cs.student_id = ae.student_id 
       WHERE cs.class_id = c.id AND ae.attendance_date = date('now')) as present
    FROM classes c
  `);

  return {
    trends: rsPresence.rows.map(r => ({ date: String(r.attendance_date), count: Number(r.count) })),
    classPerformance: rsClasses.rows.map(r => ({
      name: String(r.name),
      total: Number(r.total),
      present: Number(r.present),
      rate: Number(r.total) > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100) : 0
    }))
  };
}

export async function getAtRiskStudents(threshold = 80) {
  const database = await ensureDatabaseReady();
  
  // Get all students and calculate their rate
  const rsDays = await database.execute(`SELECT COUNT(DISTINCT attendance_date) AS total FROM attendance_events`);
  const totalDays = Number(rsDays.rows[0]?.total || 0);
  
  if (totalDays === 0) return [];

  const rsAtRisk = await database.execute({
    sql: `
      SELECT 
        s.id, s.full_name, s.student_code, s.class_name,
        COUNT(ae.id) as attended_days
      FROM students s
      LEFT JOIN attendance_events ae ON ae.student_id = s.id
      GROUP BY s.id
      HAVING (COUNT(ae.id) * 100 / :totalDays) < :threshold
      ORDER BY attended_days ASC
    `,
    args: { totalDays, threshold }
  });

  return rsAtRisk.rows.map(r => ({
    id: String(r.id),
    fullName: String(r.full_name),
    studentCode: String(r.student_code),
    className: r.class_name ? String(r.class_name) : 'Unassigned',
    rate: Math.round((Number(r.attended_days) / totalDays) * 100)
  }));
}

export async function listAttendanceReportExtended(options: { 
  classId?: string; 
  startDate?: string; 
  endDate?: string; 
  limit?: number; 
}) {
  const database = await ensureDatabaseReady();
  let query = `
    SELECT 
      ae.*, 
      s.student_code as studentCode,
      c.name as className
    FROM attendance_events ae
    JOIN students s ON s.id = ae.student_id
    LEFT JOIN class_students cs ON cs.student_id = s.id
    LEFT JOIN classes c ON c.id = cs.class_id
    WHERE 1=1
  `;
  const args: any = {};

  if (options.classId) {
    query += ` AND c.id = :classId `;
    args.classId = options.classId;
  }
  if (options.startDate) {
    query += ` AND ae.attendance_date >= :startDate `;
    args.startDate = options.startDate;
  }
  if (options.endDate) {
    query += ` AND ae.attendance_date <= :endDate `;
    args.endDate = options.endDate;
  }

  query += ` ORDER BY ae.attendance_date DESC, ae.captured_at DESC `;
  
  if (options.limit) {
    query += ` LIMIT :limit `;
    args.limit = options.limit;
  }

  const rs = await database.execute({ sql: query, args });
  return rs.rows.map(row => ({
    id: String(row.id),
    studentId: String(row.student_id),
    studentCodeSnapshot: String(row.student_code_snapshot),
    fullNameSnapshot: String(row.full_name_snapshot),
    classNameSnapshot: row.class_name_snapshot ? String(row.class_name_snapshot) : null,
    source: String(row.source),
    notes: row.notes ? String(row.notes) : null,
    attendanceDate: String(row.attendance_date),
    capturedAt: String(row.capturedAt)
  }));
}

/* 
 * -------------------------------------------------------------
 * Phase 7 - Scheduling & Manual Attendance
 * -------------------------------------------------------------
 */

export async function listAllSchedules() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`
    SELECT 
      s.*, 
      c.name AS className, 
      t.full_name AS teacherName
    FROM schedules s
    JOIN classes c ON c.id = s.class_id
    JOIN teachers t ON t.id = s.teacher_id
    ORDER BY 
      CASE day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
      END,
      start_time ASC
  `);

  return rs.rows.map(row => ({
    id: String(row.id),
    classId: String(row.class_id),
    className: String(row.className),
    teacherId: String(row.teacher_id),
    teacherName: String(row.teacherName),
    subject: String(row.subject),
    dayOfWeek: String(row.day_of_week),
    startTime: String(row.start_time),
    endTime: String(row.end_time)
  }));
}

export async function getTeacherSchedules(teacherId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT s.*, c.name AS className
      FROM schedules s
      JOIN classes c ON c.id = s.class_id
      WHERE s.teacher_id = :teacherId
      ORDER BY 
        CASE day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        start_time ASC
    `,
    args: { teacherId }
  });

  return rs.rows.map(row => ({
    id: String(row.id),
    classId: String(row.class_id),
    className: String(row.className),
    subject: String(row.subject),
    dayOfWeek: String(row.day_of_week),
    startTime: String(row.start_time),
    endTime: String(row.end_time)
  }));
}

export async function createSchedule(input: {
  classId: string;
  teacherId: string;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `
      INSERT INTO schedules (id, class_id, teacher_id, subject, day_of_week, start_time, end_time, created_at)
      VALUES (:id, :classId, :teacherId, :subject, :dayOfWeek, :startTime, :endTime, :now)
    `,
    args: { 
      id, 
      classId: input.classId, 
      teacherId: input.teacherId, 
      subject: input.subject, 
      dayOfWeek: input.dayOfWeek, 
      startTime: input.startTime, 
      endTime: input.endTime, 
      now 
    }
  });
  return id;
}

export async function deleteSchedule(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `DELETE FROM schedules WHERE id = :id`,
    args: { id }
  });
}

export async function getScheduleWithAttendance(scheduleId: string, date: string) {
  const database = await ensureDatabaseReady();
  
  // 1. Get schedule info
  const rsSchedule = await database.execute({
    sql: `
      SELECT s.*, c.name AS className, t.full_name AS teacherName
      FROM schedules s
      JOIN classes c ON c.id = s.class_id
      JOIN teachers t ON t.id = s.teacher_id
      WHERE s.id = :scheduleId
    `,
    args: { scheduleId }
  });

  const schedule = rsSchedule.rows[0];
  if (!schedule) return null;

  // 2. Get all students in that class
  const rsStudents = await database.execute({
    sql: `
      SELECT s.id, s.full_name, s.student_code
      FROM students s
      JOIN class_students cs ON cs.student_id = s.id
      WHERE cs.class_id = :classId
      ORDER BY s.full_name ASC
    `,
    args: { classId: String(schedule.class_id) }
  });

  // 3. Get existing attendance for this schedule and date
  const rsAttendance = await database.execute({
    sql: `
      SELECT student_id, status, notes
      FROM attendance_events
      WHERE schedule_id = :scheduleId AND attendance_date = :date
    `,
    args: { scheduleId, date }
  });

  const attendanceMap = new Map(rsAttendance.rows.map(r => [String(r.student_id), { status: String(r.status), notes: r.notes ? String(r.notes) : null }]));

  return {
    id: String(schedule.id),
    className: String(schedule.className),
    subject: String(schedule.subject),
    teacherName: String(schedule.teacherName),
    students: rsStudents.rows.map(s => ({
      id: String(s.id),
      fullName: String(s.full_name),
      studentCode: String(s.student_code),
      attendance: attendanceMap.get(String(s.id)) || null
    }))
  };
}

export async function markManualAttendance(input: {
  studentId: string;
  scheduleId: string;
  date: string;
  status: string;
  notes?: string;
}) {
  const database = await ensureDatabaseReady();
  
  // Get student snapshot info for the record
  const rsStudent = await database.execute({
    sql: `SELECT full_name, student_code, class_name FROM students WHERE id = :studentId`,
    args: { studentId: input.studentId }
  });
  
  const student = rsStudent.rows[0];
  if (!student) throw new Error("Student not found");

  const id = randomUUID();
  const now = isoNow();

  // We use INSERT OR REPLACE logic manually by checking if exists or using a single query if LibSQL supports it.
  // Actually, let's just delete any existing record for this student/schedule/date first to keep it simple.
  await database.execute({
    sql: `DELETE FROM attendance_events WHERE student_id = :studentId AND schedule_id = :scheduleId AND attendance_date = :date`,
    args: { studentId: input.studentId, scheduleId: input.scheduleId, date: input.date }
  });

  await database.execute({
    sql: `
      INSERT INTO attendance_events (
        id, student_id, student_code_snapshot, full_name_snapshot, class_name_snapshot, 
        source, status, schedule_id, notes, attendance_date, captured_at
      )
      VALUES (
        :id, :studentId, :studentCode, :fullName, :className, 
        'manual', :status, :scheduleId, :notes, :date, :now
      )
    `,
    args: {
      id,
      studentId: input.studentId,
      studentCode: String(student.student_code),
      fullName: String(student.full_name),
      className: student.class_name ? String(student.class_name) : null,
      status: input.status,
      scheduleId: input.scheduleId,
      notes: input.notes || null,
      date: input.date,
      now
    }
  });

  // Increment counters on student table if applicable
  if (input.status === 'Late') {
    await database.execute({
      sql: `UPDATE students SET lates_count = lates_count + 1 WHERE id = :studentId`,
      args: { studentId: input.studentId }
    });
  } else if (input.status === 'Excused') {
    await database.execute({
      sql: `UPDATE students SET excuses_count = excuses_count + 1 WHERE id = :studentId`,
      args: { studentId: input.studentId }
    });
  }

  return id;
}

export async function registerStudentUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  studentCode: string;
}) {
  const database = await ensureDatabaseReady();
  const userId = randomUUID();
  const studentId = randomUUID();
  const now = isoNow();

  await database.batch([
    {
      sql: `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) 
            VALUES (:userId, :email, :passwordHash, :fullName, 'student', :now, :now)`,
      args: { userId, email: input.email, passwordHash: input.passwordHash, fullName: input.fullName, now }
    },
    {
      sql: `INSERT INTO students (id, student_code, full_name, user_id, date_of_birth, parent_name, parent_phone, created_at, updated_at) 
            VALUES (:studentId, :studentCode, :fullName, :userId, :dateOfBirth, :parentName, :parentPhone, :now, :now)`,
      args: { 
        studentId, 
        studentCode: input.studentCode, 
        fullName: input.fullName, 
        userId, 
        dateOfBirth: input.dateOfBirth, 
        parentName: input.parentName, 
        parentPhone: input.parentPhone, 
        now 
      }
    }
  ], "write");

  return { userId, studentId };
}

export async function updateStudentProfile(studentId: string, input: {
  fullName: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  studentCode: string;
}) {
  const database = await ensureDatabaseReady();
  const now = isoNow();
  await database.execute({
    sql: `UPDATE students SET 
            full_name = :fullName, 
            date_of_birth = :dateOfBirth, 
            parent_name = :parentName, 
            parent_phone = :parentPhone,
            student_code = :studentCode,
            updated_at = :now 
          WHERE id = :studentId`,
    args: { 
      studentId, 
      fullName: input.fullName, 
      dateOfBirth: input.dateOfBirth || null, 
      parentName: input.parentName || null, 
      parentPhone: input.parentPhone || null,
      studentCode: input.studentCode,
      now 
    }
  });
}
