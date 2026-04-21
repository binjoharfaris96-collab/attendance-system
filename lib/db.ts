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

// -------------------------------------------------------------
// Database Connection & Global State
// -------------------------------------------------------------

type DatabaseGlobal = {
  database?: Client;
  isReady?: boolean;
};

const globalForDatabase = globalThis as typeof globalThis & DatabaseGlobal;

export function getDatabase() {
  if (!globalForDatabase.database) {
    const config = getDatabaseConfig();
    globalForDatabase.database = createClient(config);
  }
  return globalForDatabase.database;
}

function getDatabaseConfig() {
  const isVercel = process.env.VERCEL === "1";
  const rawUrl = process.env.DATABASE_URL?.trim();
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

  if (rawUrl) {
    const url = (() => {
      // Common footgun: users paste `your-db.turso.io` without `libsql://`.
      if (!/^[a-z]+:/i.test(rawUrl) && /[.]/.test(rawUrl)) {
        return `libsql://${rawUrl}`;
      }
      return rawUrl;
    })();

    if (!/^(libsql:|https?:|wss?:|file:)/i.test(url)) {
      throw new Error(
        "DATABASE_URL must start with libsql:, https://, wss://, or file: (Turso/libSQL).",
      );
    }

    return { url, authToken: authToken || undefined };
  }

  if (isVercel) {
    const tmpUrl = "file:/tmp/attendance.sqlite";
    console.warn(
      "[db] DATABASE_URL is not set on Vercel. Falling back to a temporary SQLite database at /tmp. " +
        "Data may not persist across deployments/regions. Set DATABASE_URL for persistence.",
    );
    return { url: tmpUrl };
  }

  const dataDirectory = join(process.cwd(), "data");
  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  return { url: `file:${join(dataDirectory, "attendance.sqlite")}` };
}

// -------------------------------------------------------------
// Mappers & Helpers
// -------------------------------------------------------------

function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: String(row.id),
    studentCode: String(row.studentCode ?? row.student_code),
    fullName: String(row.fullName ?? row.full_name),
    className: (row.className ?? row.class_name) ? String(row.className ?? row.class_name) : null,
    faceDescriptors: row.faceDescriptors ?? row.face_descriptors
      ? (JSON.parse(String(row.faceDescriptors ?? row.face_descriptors)) as number[][])
      : null,
    photoUrl: (row.photoUrl ?? row.photo_url) ? String(row.photoUrl ?? row.photo_url) : null,
    latesCount: Number(row.latesCount ?? row.lates_count ?? 0),
    excusesCount: Number(row.excusesCount ?? row.excuses_count ?? 0),
    breakLatesCount: Number(row.breakLatesCount ?? row.break_lates_count ?? 0),
    createdAt: String(row.createdAt ?? row.created_at),
    updatedAt: String(row.updatedAt ?? row.updated_at),
    userId: (row.userId ?? row.user_id) ? String(row.userId ?? row.user_id) : null,
    dateOfBirth: (row.dateOfBirth ?? row.date_of_birth) ? String(row.dateOfBirth ?? row.date_of_birth) : null,
    parentName: (row.parentName ?? row.parent_name) ? String(row.parentName ?? row.parent_name) : null,
    parentPhone: (row.parentPhone ?? row.parent_phone) ? String(row.parentPhone ?? row.parent_phone) : null,
    buildingId: (row.buildingId ?? row.building_id) ? String(row.buildingId ?? row.building_id) : null,
  };
}

function mapAttendanceEvent(row: Record<string, unknown>): AttendanceEvent {
  return {
    id: String(row.id),
    studentId: String(row.studentId ?? row.student_id),
    studentCodeSnapshot: String(row.studentCodeSnapshot ?? row.student_code_snapshot),
    fullNameSnapshot: String(row.fullNameSnapshot ?? row.full_name_snapshot),
    classNameSnapshot: (row.classNameSnapshot ?? row.class_name_snapshot) ? String(row.classNameSnapshot ?? row.class_name_snapshot) : null,
    source: String(row.source),
    status: row.status ? String(row.status) : "present",
    scheduleId: (row.scheduleId ?? row.schedule_id) ? String(row.scheduleId ?? row.schedule_id) : null,
    notes: row.notes ? String(row.notes) : null,
    attendanceDate: String(row.attendanceDate ?? row.attendance_date),
    capturedAt: String(row.capturedAt ?? row.captured_at),
    buildingId: (row.buildingId ?? row.building_id) ? String(row.buildingId ?? row.building_id) : null,
  };
}

function mapMisbehaviorReport(row: Record<string, unknown>): MisbehaviorReport {
  return {
    id: String(row.id),
    studentId: String(row.studentId ?? row.student_id),
    studentName: row.studentName ? String(row.studentName) : (row.full_name ? String(row.full_name) : ""),
    studentCode: row.studentCode ? String(row.studentCode) : (row.student_code ? String(row.student_code) : ""),
    className: (row.className ?? row.class_name_snapshot) ? String(row.className ?? row.class_name_snapshot) : null,
    issueType: String(row.issueType ?? row.issue_type),
    notes: row.notes ? String(row.notes) : null,
    reportedAt: String(row.reportedAt ?? row.reported_at),
    reportedBy: (row.reportedBy ?? row.reported_by) ? String(row.reportedBy ?? row.reported_by) : null,
  };
}

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    targetRole: String(row.targetRole ?? row.target_role ?? "all"),
    createdAt: String(row.createdAt ?? row.created_at),
    attachmentUrl: row.attachmentUrl ?? row.attachment_url ? String(row.attachmentUrl ?? row.attachment_url) : null,
    attachmentName: row.attachmentName ?? row.attachment_name ? String(row.attachmentName ?? row.attachment_name) : null,
    authorName: row.authorName ? String(row.authorName) : null,
    authorPhoto: row.authorPhoto ? String(row.authorPhoto) : null,
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

function normalizeStudentCode(value: string) {
  return value.trim().toUpperCase();
}

function sanitizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

// -------------------------------------------------------------
// Database Initialization & Migration
// -------------------------------------------------------------

export async function ensureDatabaseReady() {
  const db = getDatabase();
  if (globalForDatabase.isReady) return db;

  // Basic tables check
  await db.execute(`
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      building_id TEXT,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
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
      building_id TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance_events (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_code_snapshot TEXT NOT NULL,
      full_name_snapshot TEXT NOT NULL,
      class_name_snapshot TEXT,
      source TEXT NOT NULL,
      status TEXT DEFAULT 'present',
      schedule_id TEXT,
      notes TEXT,
      attendance_date TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      building_id TEXT,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      department TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      building_id TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
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
      building_id TEXT,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at TEXT NOT NULL,
      building_id TEXT,
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
    )
  `);

  // Extra migrations for authorship and profile photos
  try { await db.execute("ALTER TABLE users ADD COLUMN photo_url TEXT"); } catch(e) {}
  try { await db.execute("ALTER TABLE announcements ADD COLUMN author_id TEXT"); } catch(e) {}

  await db.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      created_at TEXT NOT NULL,
      building_id TEXT,
      author_id TEXT,
      attachment_url TEXT,
      attachment_name TEXT,
      attachment_type TEXT,
      scheduled_at TEXT,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE SET NULL
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
      building_id TEXT,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS absence_excuses (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      excuse_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      building_id TEXT,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(building_id) REFERENCES buildings(id) ON DELETE SET NULL
    )
  `);

  // Meta & Feature tables
  await db.execute(`CREATE TABLE IF NOT EXISTS unknown_faces (id TEXT PRIMARY KEY, image_data TEXT NOT NULL, detected_at TEXT NOT NULL, building_id TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS phone_detections (id TEXT PRIMARY KEY, image_data TEXT NOT NULL, detected_at TEXT NOT NULL, building_id TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, building_id TEXT)`);

  // Enrollment & LMS tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS class_students (
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      PRIMARY KEY (class_id, student_id),
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, class_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, due_date TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, building_id TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL, student_id TEXT NOT NULL, file_url TEXT, status TEXT NOT NULL, submitted_at TEXT NOT NULL, building_id TEXT)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS grades (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL UNIQUE, score REAL, feedback TEXT, graded_at TEXT NOT NULL, building_id TEXT)`);

  // Ensure building_id columns exist (migration)
  const tables = ["users", "students", "teachers", "classes", "announcements", "misbehavior_reports", "attendance_events", "schedules", "absence_excuses", "unknown_faces", "phone_detections", "app_settings", "assignments", "submissions", "grades"];
  for (const table of tables) {
    try { await db.execute(`ALTER TABLE ${table} ADD COLUMN building_id TEXT`); } catch (e) {}
  }

  // Feature expansion: Parents & Linking (migration)
  try { await db.execute(`ALTER TABLE users ADD COLUMN phone TEXT`); } catch (e) {}
  try { await db.execute(`ALTER TABLE buildings ADD COLUMN grades TEXT`); } catch (e) {}
  
  // Student table expansion (migration for existing databases)
  try { await db.execute(`ALTER TABLE students ADD COLUMN date_of_birth TEXT`); } catch (e) {}
  try { await db.execute(`ALTER TABLE students ADD COLUMN parent_name TEXT`); } catch (e) {}
  try { await db.execute(`ALTER TABLE students ADD COLUMN parent_phone TEXT`); } catch (e) {}
  try { await db.execute(`ALTER TABLE students ADD COLUMN user_id TEXT`); } catch (e) {}
  try { await db.execute(`ALTER TABLE students ADD COLUMN lates_count INTEGER DEFAULT 0`); } catch (e) {}
  try { await db.execute(`ALTER TABLE students ADD COLUMN excuses_count INTEGER DEFAULT 0`); } catch (e) {}
  try { await db.execute(`ALTER TABLE students ADD COLUMN break_lates_count INTEGER DEFAULT 0`); } catch (e) {}
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS parent_student_requests (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);

  await db.execute("CREATE INDEX IF NOT EXISTS idx_attendance_events_student ON attendance_events(student_id, captured_at DESC)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_attendance_events_date ON attendance_events(attendance_date, captured_at DESC)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_misbehavior_student ON misbehavior_reports(student_id, reported_at DESC)");

  await autoMigrateBuildings(db);

  await db.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('late_cutoff_minutes', '470')");

  globalForDatabase.isReady = true;
  return db;
}

async function autoMigrateBuildings(db: Client) {
  const rs = await db.execute("SELECT COUNT(*) as count FROM buildings");
  const count = Number(rs.rows[0].count);

  if (count === 0) {
    const mainBuildingId = randomUUID();
    const now = isoNow();
    await db.execute({
      sql: "INSERT INTO buildings (id, name, address, created_at) VALUES (:id, :name, :address, :createdAt)",
      args: { id: mainBuildingId, name: "Main Building", address: "Default Campus", createdAt: now }
    });

    const tables = ["users", "students", "teachers", "classes", "announcements", "misbehavior_reports", "attendance_events", "schedules", "absence_excuses", "unknown_faces", "phone_detections", "app_settings", "assignments", "submissions", "grades"];
    for (const table of tables) {
      try {
        await db.execute({
          sql: `UPDATE ${table} SET building_id = :bid WHERE building_id IS NULL`,
          args: { bid: mainBuildingId }
        });
      } catch (e) {}
    }
  }
}

// -------------------------------------------------------------
// Auth & User Management
// -------------------------------------------------------------

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  buildingId: string | null;
  phone: string | null;
};

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT
        id, email, password_hash AS passwordHash, full_name AS fullName,
        role, created_at AS createdAt, updated_at AS updatedAt,
        building_id AS buildingId, phone
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
    buildingId: row.buildingId ? String(row.buildingId) : null,
    phone: row.phone ? String(row.phone) : null,
  };
}

export async function updateUserRoleAndPhone(userId: string, role: string, phone: string | null) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `UPDATE users SET role = :role, phone = :phone, updated_at = :now WHERE id = :id`,
    args: {
      role,
      phone: phone || null,
      now: isoNow(),
      id: userId
    }
  });
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: string;
  buildingId?: string | null;
  phone?: string | null;
}) {
  const database = await ensureDatabaseReady();
  const now = isoNow();
  const id = randomUUID();

  await database.execute({
    sql: `
      INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, building_id, phone)
      VALUES (:id, :email, :passwordHash, :fullName, :role, :now, :now, :buildingId, :phone)
    `,
    args: {
      id,
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      fullName: input.fullName.trim(),
      role: input.role || "admin",
      now,
      buildingId: input.buildingId ?? null,
      phone: input.phone ?? null,
    },
  });

  return {
    id,
    email: input.email.toLowerCase().trim(),
    passwordHash: input.passwordHash,
    fullName: input.fullName.trim(),
    role: input.role || "admin",
    createdAt: now,
    updatedAt: now,
    buildingId: input.buildingId || null,
    phone: input.phone || null,
  };
}

export async function listAdminsWithBuildings() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`
    SELECT u.id, u.email, u.full_name AS fullName, u.role, u.building_id AS buildingId, b.name AS buildingName
    FROM users u
    LEFT JOIN buildings b ON b.id = u.building_id
    WHERE u.role = 'admin' OR u.role = 'owner'
    ORDER BY u.role DESC, u.email ASC
  `);
  
  return rs.rows.map(row => ({
    id: String(row.id),
    email: String(row.email),
    fullName: String(row.fullName),
    role: String(row.role),
    buildingId: row.buildingId ? String(row.buildingId) : null,
    buildingName: row.buildingName ? String(row.buildingName) : null
  }));
}

export async function updateUserBuilding(userId: string, buildingId: string | null) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `UPDATE users SET building_id = :buildingId, updated_at = :now WHERE id = :userId`,
    args: { buildingId, userId, now: isoNow() }
  });
}

// -------------------------------------------------------------
// Student Management
// -------------------------------------------------------------

export async function getStudentById(id: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT *, student_code AS studentCode, full_name AS fullName, class_name AS className, 
             face_descriptors AS faceDescriptors, photo_url AS photoUrl, 
             lates_count AS latesCount, excuses_count AS excusesCount, 
             break_lates_count AS breakLatesCount, created_at AS createdAt, updated_at AS updatedAt,
             user_id as userId, date_of_birth as dateOfBirth, parent_name as parentName, 
             parent_phone as parentPhone, building_id as buildingId
      FROM students WHERE id = :id LIMIT 1
    `,
    args: { id }
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
  buildingId: string | null;
}) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();

  await database.execute({
    sql: `
      INSERT INTO students (
        id, student_code, full_name, class_name, face_descriptors, photo_url,
        lates_count, excuses_count, break_lates_count, created_at, updated_at,
        date_of_birth, parent_name, parent_phone, building_id
      ) VALUES (
        :id, :studentCode, :fullName, :className, :faceDescriptors, :photoUrl,
        0, 0, 0, :now, :now, :dateOfBirth, :parentName, :parentPhone, :buildingId
      )
    `,
    args: {
      id,
      studentCode: normalizeStudentCode(input.studentCode),
      fullName: input.fullName.trim(),
      className: sanitizeOptional(input.className),
      faceDescriptors: input.faceDescriptors ? JSON.stringify(input.faceDescriptors) : null,
      photoUrl: input.photoUrl ?? null,
      now,
      dateOfBirth: sanitizeOptional(input.dateOfBirth),
      parentName: sanitizeOptional(input.parentName),
      parentPhone: sanitizeOptional(input.parentPhone),
      buildingId: input.buildingId,
    }
  });

  return getStudentById(id);
}

export async function updateStudent(id: string, input: any) {
  const database = await ensureDatabaseReady();
  const now = isoNow();

  let sql = `UPDATE students SET updated_at = :now `;
  const args: any = { id, now };

  if (input.studentCode !== undefined) { sql += `, student_code = :studentCode`; args.studentCode = normalizeStudentCode(input.studentCode); }
  if (input.fullName !== undefined) { sql += `, full_name = :fullName`; args.fullName = input.fullName.trim(); }
  if (input.className !== undefined) { sql += `, class_name = :className`; args.className = sanitizeOptional(input.className); }
  if (input.photoUrl !== undefined) { sql += `, photo_url = :photoUrl`; args.photoUrl = input.photoUrl; }
  if (input.faceDescriptors !== undefined) { sql += `, face_descriptors = :faceDescriptors`; args.faceDescriptors = input.faceDescriptors ? JSON.stringify(input.faceDescriptors) : null; }
  if (input.dateOfBirth !== undefined) { sql += `, date_of_birth = :dateOfBirth`; args.dateOfBirth = sanitizeOptional(input.dateOfBirth); }
  if (input.parentName !== undefined) { sql += `, parent_name = :parentName`; args.parentName = sanitizeOptional(input.parentName); }
  if (input.parentPhone !== undefined) { sql += `, parent_phone = :parentPhone`; args.parentPhone = sanitizeOptional(input.parentPhone); }
  if (input.buildingId !== undefined) { sql += `, building_id = :buildingId`; args.buildingId = input.buildingId; }

  sql += ` WHERE id = :id `;
  await database.execute({ sql, args });
  return getStudentById(id);
}

export async function listStudents(buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `
    SELECT
      s.*, s.student_code AS studentCode, s.full_name AS fullName, s.class_name AS className, 
      u.email AS userEmail,
      (SELECT COUNT(*) FROM attendance_events ae WHERE ae.student_id = s.id) AS attendanceCount,
      (SELECT MAX(captured_at) FROM attendance_events ae WHERE ae.student_id = s.id) AS lastAttendanceAt
    FROM students s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE 1=1
  `;
  const args: any = {};
  if (buildingId) {
    sql += ` AND s.building_id = :buildingId `;
    args.buildingId = buildingId;
  }
  sql += ` ORDER BY s.full_name ASC `;

  const rs = await database.execute({ sql, args });
  return rs.rows.map((row) => mapStudentListItem(row as unknown as Record<string, unknown>));
}

export async function deleteStudent(id: string) {
  const database = await ensureDatabaseReady();
  await database.batch([
    { sql: `DELETE FROM attendance_events WHERE student_id = ?`, args: [id] },
    { sql: `DELETE FROM students WHERE id = ?`, args: [id] }
  ], "write");
}

// -------------------------------------------------------------
// Dashboard & Analytics
// -------------------------------------------------------------

export async function getDashboardSummary(buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  const today = toAttendanceDate(isoNow());
  const sevenDaysAgo = shiftDate(today, -6);

  let totalStudentsSql = `SELECT COUNT(*) AS total FROM students WHERE 1=1`;
  let totalClassesSql = `SELECT COUNT(*) AS total FROM classes WHERE 1=1`;
  let todaySql = `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date = :today`;
  let last7Sql = `SELECT COUNT(*) AS total FROM attendance_events WHERE attendance_date >= :sevenDaysAgo`;
  
  if (buildingId) {
    totalStudentsSql += ` AND building_id = :buildingId `;
    totalClassesSql += ` AND building_id = :buildingId `;
    todaySql += ` AND building_id = :buildingId `;
    last7Sql += ` AND building_id = :buildingId `;
  }

  const argsTotal: Record<string, string> | undefined = buildingId ? { buildingId } : undefined;
  const argsToday: Record<string, string> = buildingId ? { today, buildingId } : { today };
  const argsLast7: Record<string, string> = buildingId
    ? { sevenDaysAgo, buildingId }
    : { sevenDaysAgo };

  const [rsTotal, rsClasses, rsToday, rsLast7] = await Promise.all([
    database.execute({ sql: totalStudentsSql, args: argsTotal }),
    database.execute({ sql: totalClassesSql, args: argsTotal }),
    database.execute({ sql: todaySql, args: argsToday }),
    database.execute({ sql: last7Sql, args: argsLast7 })
  ]);

  return {
    totalStudents: Number(rsTotal.rows[0]?.total ?? 0),
    todayAttendance: Number(rsToday.rows[0]?.total ?? 0),
    attendanceLast7Days: Number(rsLast7.rows[0]?.total ?? 0),
    totalClasses: Number(rsClasses.rows[0]?.total ?? 0)
  };
}

export async function getTodayAttendanceBreakdown(buildingId?: string | null): Promise<TodayAttendanceBreakdown> {
  const database = await ensureDatabaseReady();
  const today = toAttendanceDate(isoNow());
  const lateCutoffMinutes = parseInt(await getSetting("late_cutoff_minutes", "470"), 10);

  let totalStudentsSql = `SELECT COUNT(*) AS total FROM students WHERE 1=1`;
  let eventsSql = `SELECT captured_at AS capturedAt FROM attendance_events WHERE attendance_date = :today`;
  if (buildingId) {
    totalStudentsSql += ` AND building_id = :buildingId `;
    eventsSql += ` AND building_id = :buildingId `;
  }

  const argsTotal: Record<string, string> | undefined = buildingId ? { buildingId } : undefined;
  const argsEvents: Record<string, string> = buildingId ? { today, buildingId } : { today };

  const [rsTotal, rsEvents] = await Promise.all([
    database.execute({ sql: totalStudentsSql, args: argsTotal }),
    database.execute({ sql: eventsSql, args: argsEvents })
  ]);

  const totalStudents = Number(rsTotal.rows[0]?.total ?? 0);
  let onTime = 0;
  let late = 0;

  for (const row of rsEvents.rows) {
    const mins = row.capturedAt ? minutesSinceMidnightFromIso(String(row.capturedAt)) : 0;
    if (mins > lateCutoffMinutes) late += 1;
    else onTime += 1;
  }

  return { totalStudents, onTime, late, absent: Math.max(0, totalStudents - (onTime + late)) };
}

export async function getDailyAttendanceCounts(days = 7, buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  const today = toAttendanceDate(isoNow());
  const start = shiftDate(today, days * -1 + 1);

  let sql = `SELECT attendance_date AS day, COUNT(*) AS total FROM attendance_events WHERE attendance_date >= :start `;
  const args: any = { start };
  if (buildingId) { sql += ` AND building_id = :buildingId `; args.buildingId = buildingId; }
  sql += ` GROUP BY attendance_date ORDER BY attendance_date ASC `;

  const rs = await database.execute({ sql, args });
  const countsByDay = new Map(rs.rows.map((row) => [String(row.day), Number(row.total ?? 0)]));
  const timeline: DailyAttendanceCount[] = [];

  for (let index = 0; index < days; index += 1) {
    const day = shiftDate(start, index);
    timeline.push({ day, total: countsByDay.get(day) ?? 0 });
  }
  return timeline;
}

export async function getRosterSnapshot(buildingId?: string | null) {
  const students = await listStudents(buildingId);
  const summary = await getDashboardSummary(buildingId);
  const dailyCounts = await getDailyAttendanceCounts(7, buildingId);
  const latestDay = dailyCounts[dailyCounts.length - 1]?.day ?? toAttendanceDate(isoNow());

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

// -------------------------------------------------------------
// Attendance Operations
// -------------------------------------------------------------

export async function listRecentAttendance(limit = 12, buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `
    SELECT *, student_id AS studentId, student_code_snapshot AS studentCodeSnapshot, 
           full_name_snapshot AS fullNameSnapshot, class_name_snapshot AS classNameSnapshot,
           attendance_date AS attendanceDate, captured_at AS capturedAt
    FROM attendance_events WHERE 1=1
  `;
  const args: any = { limit };
  if (buildingId) { sql += ` AND building_id = :buildingId `; args.buildingId = buildingId; }
  sql += ` ORDER BY captured_at DESC LIMIT :limit `;

  const rs = await database.execute({ sql, args });
  return rs.rows.map((row) => mapAttendanceEvent(row as unknown as Record<string, unknown>));
}

export async function recordAttendanceByStudentCode(input: {
  studentCode: string;
  notes?: string | null;
  source?: string;
}) {
  const database = await ensureDatabaseReady();
  const studentCode = normalizeStudentCode(input.studentCode);
  const rsStudent = await database.execute({
    sql: `SELECT * FROM students WHERE student_code = :studentCode LIMIT 1`,
    args: { studentCode }
  });

  const studentRow = rsStudent.rows[0];
  if (!studentRow) return { status: "missing" as const, message: `No student found for code ${studentCode}.` };

  const student = mapStudent(studentRow as unknown as Record<string, unknown>);
  const capturedAt = isoNow();
  const attendanceDate = toAttendanceDate(capturedAt);

  // Check duplicate
  const rsDup = await database.execute({
    sql: `SELECT * FROM attendance_events WHERE student_id = :sid AND attendance_date = :date LIMIT 1`,
    args: { sid: student.id, date: attendanceDate }
  });
  if (rsDup.rows[0]) return { status: "duplicate" as const, message: `${student.fullName} already checked in.`, event: mapAttendanceEvent(rsDup.rows[0] as any) };

  // Cutoff logic
  const localTime = new Date(capturedAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false });
  const [h, m] = localTime.split(":").map(Number);
  const mins = h * 60 + m;

  const open = parseInt(await getSetting("check_in_open_minutes", "0"), 10);
  const close = parseInt(await getSetting("check_in_close_minutes", "1439"), 10);
  const cutoff = parseInt(await getSetting("late_cutoff_minutes", "470"), 10);

  if (mins < open) return { status: "rejected" as const, message: "Check-in not yet open." };
  if (mins > close) return { status: "rejected" as const, message: "Check-in closed for today." };

  const status = mins > cutoff ? "late" : "present";
  const id = randomUUID();

  await database.execute({
    sql: `
      INSERT INTO attendance_events (id, student_id, student_code_snapshot, full_name_snapshot, class_name_snapshot, source, status, attendance_date, captured_at, building_id)
      VALUES (:id, :sid, :scode, :name, :class, :source, :status, :date, :at, :bid)
    `,
    args: {
      id, sid: student.id, scode: student.studentCode, name: student.fullName, class: student.className,
      source: input.source || "manual", status, date: attendanceDate, at: capturedAt, bid: student.buildingId
    }
  });

  if (status === "late") {
    await database.execute({ sql: `UPDATE students SET lates_count = lates_count + 1 WHERE id = ?`, args: [student.id] });
  }

  return { status: "created" as const, message: `${student.fullName} marked ${status}.`, student, event: { id, studentId: student.id, status } as any };
}

// -------------------------------------------------------------
// Disciplinary & Excuses
// -------------------------------------------------------------

export async function createMisbehaviorReport(input: {
  studentId: string;
  className?: string | null;
  issueType: string;
  notes?: string | null;
  reportedBy?: string | null;
  buildingId?: string | null;
}) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();

  await database.execute({
    sql: `INSERT INTO misbehavior_reports (id, student_id, class_name_snapshot, issue_type, notes, reported_by, reported_at, building_id)
          VALUES (:id, :sid, :class, :issue, :notes, :by, :at, :bid)`,
    args: {
      id, sid: input.studentId, class: input.className || null, issue: input.issueType,
      notes: input.notes || null, by: input.reportedBy || null, at: now, bid: input.buildingId || null
    }
  });
  return id;
}

export async function listRecentMisbehaviorReports(limit = 50, buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `
    SELECT r.*, s.full_name AS studentName, s.student_code AS studentCode
    FROM misbehavior_reports r
    JOIN students s ON s.id = r.student_id
    WHERE 1=1
  `;
  const args: any = { limit };
  if (buildingId) { sql += ` AND r.building_id = :bid `; args.bid = buildingId; }
  sql += ` ORDER BY r.reported_at DESC LIMIT :limit `;
  const rs = await database.execute({ sql, args });
  return rs.rows.map(row => mapMisbehaviorReport(row as any));
}

export async function createExcuse(studentId: string, reason: string, excuseDate: string, buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.batch([
    { sql: `UPDATE students SET lates_count = MAX(0, lates_count - 1), excuses_count = excuses_count + 1 WHERE id = ?`, args: [studentId] },
    { sql: `INSERT INTO absence_excuses (id, student_id, reason, excuse_date, created_at, building_id) VALUES (?, ?, ?, ?, ?, ?)`, args: [id, studentId, reason, excuseDate, now, buildingId || null] }
  ], "write");
}

export async function listExcuses(limit = 50, buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `SELECT e.*, s.full_name AS studentName FROM absence_excuses e JOIN students s ON s.id = e.student_id WHERE 1=1 `;
  const args: any = { limit };
  if (buildingId) { sql += ` AND e.building_id = :bid `; args.bid = buildingId; }
  sql += ` ORDER BY e.created_at DESC LIMIT :limit `;
  const rs = await database.execute({ sql, args });
  return rs.rows.map(row => ({
    id: String(row.id), studentId: String(row.student_id), studentName: String(row.studentName),
    reason: String(row.reason), excuseDate: String(row.excuse_date), createdAt: String(row.created_at)
  }));
}

// -------------------------------------------------------------
// Announcements
// -------------------------------------------------------------

export async function createAnnouncement(
  title: string, 
  content: string, 
  targetRole: string, 
  buildingId?: string | null,
  attachmentUrl?: string | null,
  attachmentName?: string | null,
  attachmentType?: string | null,
  scheduledAt?: string | null,
  authorId?: string | null
) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `INSERT INTO announcements (id, title, content, target_role, created_at, building_id, attachment_url, attachment_name, attachment_type, scheduled_at, author_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, title, content, targetRole, now, buildingId || null, attachmentUrl || null, attachmentName || null, attachmentType || null, scheduledAt || null, authorId || null]
  });
  return id;
}

export async function getLatestAnnouncements(role: string, limit: number, buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `
    SELECT a.*, u.full_name AS authorName, u.photo_url AS authorPhoto
    FROM announcements a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE (a.target_role = 'all' OR a.target_role = :role) 
    AND (a.scheduled_at IS NULL OR a.scheduled_at <= datetime('now')) 
  `;
  const args: any = { role, limit };
  if (buildingId) { sql += ` AND (a.building_id = :bid OR a.building_id IS NULL) `; args.bid = buildingId; }
  sql += ` ORDER BY a.created_at DESC LIMIT :limit `;
  const rs = await database.execute({ sql, args });
  return rs.rows.map(row => mapAnnouncement(row as any));
}

// -------------------------------------------------------------
// Class & Teacher Management
// -------------------------------------------------------------

export async function listAllClasses(buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `
    SELECT c.*, t.full_name AS teacherName, (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) AS studentCount
    FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE 1=1
  `;
  const args: any = {};
  if (buildingId) { sql += ` AND c.building_id = :bid `; args.bid = buildingId; }
  const rs = await database.execute({ sql, args });
  return rs.rows.map(r => ({ ...r, id: String(r.id), name: String(r.name), teacherName: String(r.teacherName), studentCount: Number(r.studentCount) } as any));
}

export async function createClass(input: { name: string; teacherId: string; subject?: string; buildingId?: string | null }) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `INSERT INTO classes (id, name, teacher_id, subject, created_at, updated_at, building_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.name, input.teacherId, input.subject || null, now, now, input.buildingId || null]
  });
  return id;
}

export async function listTeachers(buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `
    SELECT 
      t.*, 
      u.email AS userEmail,
      (SELECT COUNT(*) FROM classes c WHERE c.teacher_id = t.id) as classesCount
    FROM teachers t 
    LEFT JOIN users u ON u.id = t.user_id 
    WHERE 1=1 
  `;
  const args: any = {};
  if (buildingId) { sql += ` AND t.building_id = :bid `; args.bid = buildingId; }
  const rs = await database.execute({ sql, args });
  return rs.rows.map(r => ({ 
    id: String(r.id), 
    fullName: String(r.full_name), 
    userId: r.user_id ? String(r.user_id) : null,
    department: r.department ? String(r.department) : null, 
    userEmail: r.userEmail ? String(r.userEmail) : null,
    classesCount: Number(r.classesCount || 0)
  }));
}

export async function createTeacher(data: { fullName: string, department?: string, buildingId?: string | null }) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `INSERT INTO teachers (id, full_name, department, created_at, updated_at, building_id) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, data.fullName, data.department || null, now, now, data.buildingId || null]
  });
  return id;
}

// -------------------------------------------------------------
// Scheduling
// -------------------------------------------------------------

export async function listAllSchedules(buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `SELECT s.*, c.name AS className, t.full_name AS teacherName FROM schedules s JOIN classes c ON c.id = s.class_id JOIN teachers t ON t.id = s.teacher_id WHERE 1=1 `;
  const args: any = {};
  if (buildingId) { sql += ` AND s.building_id = :bid `; args.bid = buildingId; }
  sql += ` ORDER BY day_of_week, start_time `;
  const rs = await database.execute({ sql, args });
  return rs.rows.map(r => ({ id: String(r.id), className: String(r.className), teacherName: String(r.teacherName), subject: String(r.subject), dayOfWeek: String(r.day_of_week), startTime: String(r.start_time), endTime: String(r.end_time) } as any));
}

export async function saveWeeklySchedulesForClass(classId: string, schedules: any[], buildingId?: string | null) {
  const database = await ensureDatabaseReady();
  const now = isoNow();
  await database.execute({ sql: `DELETE FROM schedules WHERE class_id = ?`, args: [classId] });
  for (const s of schedules) {
    if (!s.teacherId) continue;
    await database.execute({
      sql: `INSERT INTO schedules (id, class_id, teacher_id, subject, day_of_week, start_time, end_time, created_at, building_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), classId, s.teacherId, s.subject, s.dayOfWeek, s.startTime, s.endTime, now, buildingId || null]
    });
  }
}

// -------------------------------------------------------------
// Building Management
// -------------------------------------------------------------

export async function listBuildings() {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`SELECT * FROM buildings ORDER BY name ASC`);
  return rs.rows.map(r => ({ 
    id: String(r.id), 
    name: String(r.name), 
    address: r.address ? String(r.address) : null, 
    grades: r.grades ? String(r.grades) : null,
    createdAt: String(r.created_at) 
  }));
}

export async function createBuilding(data: { name: string; address?: string; grades?: string }) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  await database.execute({ 
    sql: `INSERT INTO buildings (id, name, address, grades, created_at) VALUES (?, ?, ?, ?, ?)`, 
    args: [id, data.name, data.address || null, data.grades || null, isoNow()] 
  });
  return id;
}

export async function deleteBuilding(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `DELETE FROM buildings WHERE id = ?`, args: [id] });
}

// -------------------------------------------------------------
// Settings & Meta
// -------------------------------------------------------------

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({ sql: `SELECT value FROM app_settings WHERE key = ?`, args: [key] });
  return rs.rows[0] ? String(rs.rows[0].value) : defaultValue;
}

export async function updateSetting(key: string, value: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, args: [key, value] });
}

// Meta features (Faces/Phones) - simplified for brevity
export async function recordUnknownFace(image: string, bid?: string | null) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `INSERT INTO unknown_faces (id, image_data, detected_at, building_id) VALUES (?, ?, ?, ?)`, args: [randomUUID(), image, isoNow(), bid || null] });
}
export async function listUnknownFaces(limit = 50, bid?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `SELECT * FROM unknown_faces WHERE 1=1 `;
  const args: any = [limit];
  if (bid) { sql += ` AND building_id = ? `; args.unshift(bid); }
  sql += ` ORDER BY detected_at DESC LIMIT ? `;
  const rs = await database.execute({ sql, args });
  return rs.rows.map(r => ({
    id: String(r.id),
    imageData: String(r.image_data),
    detectedAt: String(r.detected_at),
    buildingId: r.building_id ? String(r.building_id) : null
  }));
}

// Enrollment
export async function enrollStudentInClass(sid: string, cid: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `INSERT OR IGNORE INTO class_students (class_id, student_id) VALUES (?, ?)`, args: [cid, sid] });
}

export async function getClassWithRoster(cid: string) {
  const database = await ensureDatabaseReady();
  const rsCls = await database.execute({ sql: `SELECT c.*, t.full_name as teacherName FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE c.id = ?`, args: [cid] });
  if (!rsCls.rows[0]) return null;
  const cls = rsCls.rows[0];
  const rsRos = await database.execute({ sql: `SELECT s.* FROM students s JOIN class_students cs ON cs.student_id = s.id WHERE cs.class_id = ?`, args: [cid] });
  return { 
    id: String(cls.id), 
    name: String(cls.name), 
    teacherId: String(cls.teacher_id),
    teacherName: String(cls.teacherName), 
    subject: cls.subject ? String(cls.subject) : null,
    students: rsRos.rows.map(r => mapStudent(r as any)) 
  };
}

// Backup (Minimal impl for logic preservation)
export async function exportSystemBackup(): Promise<any> {
    const database = await ensureDatabaseReady();
    const students = await listStudents();
    return { version: 1, exportedAt: isoNow(), data: { students } };
}

// Phase Extensions (Preserve unique tools identified earlier)
export async function getAtRiskStudents(threshold = 80, bid?: string | null) {
    const database = await ensureDatabaseReady();
    const students = await listStudents(bid);
    // Simple mock calculation for now e.g. based on record counts
    return students.map(s => ({
       ...s,
       rate: s.attendanceCount > 0 ? 85 : 50 // Dummy rate for demo
    })).filter(s => s.rate < threshold);
}

export async function countUnknownFaces(bid?: string | null) {
    const database = await ensureDatabaseReady();
    let sql = `SELECT COUNT(*) as count FROM unknown_faces WHERE 1=1 `;
    const args: any = {};
    if (bid) { sql += ` AND building_id = :bid `; args.bid = bid; }
    const rs = await database.execute({ sql, args });
    return Number(rs.rows[0]?.count || 0);
}

export async function countPhoneDetections(bid?: string | null) {
    const database = await ensureDatabaseReady();
    let sql = `SELECT COUNT(*) as count FROM phone_detections WHERE 1=1 `;
    const args: any = {};
    if (bid) { sql += ` AND building_id = :bid `; args.bid = bid; }
    const rs = await database.execute({ sql, args });
    return Number(rs.rows[0]?.count || 0);
}

export async function unenrollStudentFromClass(studentId: string, classId: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `DELETE FROM class_students WHERE class_id = ? AND student_id = ?`, args: [classId, studentId] });
}

export async function updateClassTeacher(classId: string, teacherId: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `UPDATE classes SET teacher_id = ?, updated_at = ? WHERE id = ?`, args: [teacherId, isoNow(), classId] });
}

export async function updateStudentUserId(studentId: string, userId: string | null) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `UPDATE students SET user_id = ? WHERE id = ?`, args: [userId, studentId] });
}

export async function updateTeacherUserId(teacherId: string, userId: string | null) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `UPDATE teachers SET user_id = ? WHERE id = ?`, args: [userId, teacherId] });
}

export async function deleteClass(id: string) {
  const database = await ensureDatabaseReady();
  await database.batch([
    { sql: `DELETE FROM class_students WHERE class_id = ?`, args: [id] },
    { sql: `DELETE FROM schedules WHERE class_id = ?`, args: [id] },
    { sql: `DELETE FROM classes WHERE id = ?`, args: [id] }
  ], "write");
}

export async function deleteTeacher(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `DELETE FROM teachers WHERE id = ?`, args: [id] });
}

export async function deleteAnnouncement(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `DELETE FROM announcements WHERE id = ?`, args: [id] });
}

export async function deleteSchedule(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `DELETE FROM schedules WHERE id = ?`, args: [id] });
}

export async function createSchedule(data: { classId: string; teacherId: string; subject: string; dayOfWeek: string; startTime: string; endTime: string; buildingId?: string | null }) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  await database.execute({
    sql: `INSERT INTO schedules (id, class_id, teacher_id, subject, day_of_week, start_time, end_time, created_at, building_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.classId, data.teacherId, data.subject, data.dayOfWeek, data.startTime, data.endTime, isoNow(), data.buildingId || null]
  });
  return id;
}

export async function insertAssignment(
  classId: string, 
  title: string, 
  description: string, 
  dueDate: string,
  topic?: string | null,
  type?: string | null,
  points?: number | null,
  attachmentUrl?: string | null,
  attachmentName?: string | null,
  scheduledAt?: string | null
) {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `INSERT INTO assignments (id, class_id, title, description, due_date, created_at, topic, assignment_type, points, attachment_url, attachment_name, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [randomUUID(), classId, title, description, dueDate, isoNow(), topic || null, type || "assignment", points ?? 100, attachmentUrl || null, attachmentName || null, scheduledAt || null]
  });
}

export async function getTeacherByUserId(userId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({ sql: `SELECT * FROM teachers WHERE user_id = ?`, args: [userId] });
  const r = rs.rows[0];
  return r ? { 
    id: String(r.id), 
    fullName: String(r.full_name), 
    department: r.department ? String(r.department) : null,
    user_id: String(r.user_id), 
    buildingId: r.building_id ? String(r.building_id) : null 
  } : null;
}

export async function getTeacherClasses(teacherId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({ 
    sql: `
      SELECT c.*, 
             (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as studentCount 
      FROM classes c 
      WHERE c.teacher_id = ?
    `, 
    args: [teacherId] 
  });
  return rs.rows.map(r => ({ 
    id: String(r.id), 
    name: String(r.name), 
    subject: r.subject ? String(r.subject) : null,
    studentCount: Number(r.studentCount || 0)
  }));
}

export async function updateStudentDisciplinaryCount(studentId: string, type: "late" | "excused" | "break_late", amount: number) {
  const database = await ensureDatabaseReady();
  const column = type === "late" ? "lates_count" : (type === "excused" ? "excuses_count" : "break_lates_count");
  await database.execute({ sql: `UPDATE students SET ${column} = MAX(0, ${column} + ?) WHERE id = ?`, args: [amount, studentId] });
}

export async function deleteExcuse(id: string) {
  const database = await ensureDatabaseReady();
  await database.execute({ sql: `DELETE FROM absence_excuses WHERE id = ?`, args: [id] });
}

export async function markManualAttendance(input: { studentId: string; scheduleId: string; date: string; status: string; notes?: string; buildingId?: string | null }) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  
  const student = await getStudentById(input.studentId);
  if (!student) throw new Error("Student not found");

  await database.execute({
    sql: `INSERT INTO attendance_events (id, student_id, student_code_snapshot, full_name_snapshot, class_name_snapshot, source, status, schedule_id, notes, attendance_date, captured_at, building_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.studentId, student.studentCode, student.fullName, student.className, "manual", input.status, input.scheduleId, input.notes || null, input.date, now, input.buildingId || student.buildingId]
  });

  if (input.status === "late") {
    await database.execute({ sql: `UPDATE students SET lates_count = lates_count + 1 WHERE id = ?`, args: [input.studentId] });
  }
}

export async function registerStudentUser(input: any) {
    const database = await ensureDatabaseReady();
    const userId = randomUUID();
    const studentId = randomUUID();
    const now = isoNow();
    
    await database.batch([
        { sql: `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, 'student', ?, ?)`, args: [userId, input.email, input.passwordHash, input.fullName, now, now] },
        { sql: `INSERT INTO students (id, user_id, student_code, full_name, date_of_birth, parent_name, parent_phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [studentId, userId, input.studentCode, input.fullName, input.dateOfBirth, input.parentName, input.parentPhone, now, now] }
    ], "write");
}

export async function clearUnknownFaces(bid?: string | null) {
    const database = await ensureDatabaseReady();
    let sql = `DELETE FROM unknown_faces WHERE 1=1 `;
    const args: any = [];
    if (bid) { sql += ` AND building_id = ? `; args.push(bid); }
    await database.execute({ sql, args });
}

export async function recordPhoneDetection(image: string, bid?: string | null) {
    const database = await ensureDatabaseReady();
    await database.execute({ sql: `INSERT INTO phone_detections (id, image_data, detected_at, building_id) VALUES (?, ?, ?, ?)`, args: [randomUUID(), image, isoNow(), bid || null] });
}

export async function clearPhoneDetections(bid?: string | null) {
    const database = await ensureDatabaseReady();
    let sql = `DELETE FROM phone_detections WHERE 1=1 `;
    const args: any = [];
    if (bid) { sql += ` AND building_id = ? `; args.push(bid); }
    await database.execute({ sql, args });
}

export async function getUnlinkedUsers(forType?: "student" | "teacher") {
  const database = await ensureDatabaseReady();
  const rs = await database.execute(`
    SELECT u.* FROM users u 
    LEFT JOIN students s ON s.user_id = u.id 
    LEFT JOIN teachers t ON t.user_id = u.id 
    WHERE s.id IS NULL AND t.id IS NULL AND u.role NOT IN ('owner', 'admin')
  `);
  return rs.rows.map(r => ({ id: String(r.id), email: String(r.email), fullName: String(r.full_name) }));
}

export async function getTeacherById(id: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT * FROM teachers WHERE id = ? LIMIT 1`,
    args: [id]
  });
  const row = rs.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    fullName: String(row.full_name),
    department: row.department ? String(row.department) : null,
    buildingId: row.building_id ? String(row.building_id) : null
  };
}

export async function listAllAnnouncements(bid?: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `SELECT * FROM announcements WHERE 1=1 `;
  const args: any = {};
  if (bid) { sql += ` AND building_id = :bid `; args.bid = bid; }
  sql += ` ORDER BY created_at DESC `;
  const rs = await database.execute({ sql, args });
  return rs.rows.map(row => mapAnnouncement(row as any));
}

export async function listAttendanceForStudent(sid: string, limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({ 
    sql: `SELECT * FROM attendance_events WHERE student_id = ? ORDER BY captured_at DESC LIMIT ?`, 
    args: [sid, limit] 
  });
  return rs.rows.map(row => mapAttendanceEvent(row as any));
}

export async function listMisbehaviorReportsForStudent(sid: string, limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({ 
    sql: `SELECT * FROM misbehavior_reports WHERE student_id = ? ORDER BY reported_at DESC LIMIT ?`, 
    args: [sid, limit] 
  });
  return rs.rows.map(row => mapMisbehaviorReport(row as any));
}

export async function listAttendanceReport(limitOrBid?: number | string | null, maybeDate?: string) {
  if (typeof limitOrBid === "number") {
    // If first arg is number, treat as (limit, date) for backward compatibility with report API
    return listAttendanceReportExtended({ 
      limit: limitOrBid, 
      startDate: maybeDate || undefined, 
      endDate: maybeDate || undefined 
    });
  }
  // Otherwise treat as buildingId
  return listAttendanceReportExtended({ buildingId: limitOrBid as string | null });
}

export async function listAttendanceReportExtended(options: string | null | { 
  buildingId?: string | null, 
  classId?: string, 
  startDate?: string, 
  endDate?: string, 
  limit?: number 
}) {
  const database = await ensureDatabaseReady();
  
  // Handle legacy string argument (buildingId)
  const filter = typeof options === 'string' || options === null 
    ? { buildingId: options } 
    : options;

  let sql = `
    SELECT ae.*, s.full_name as fullName, s.student_code as studentCode 
    FROM attendance_events ae 
    JOIN students s ON s.id = ae.student_id 
    WHERE 1=1 
  `;
  const args: any = {};

  if (filter.buildingId) { sql += ` AND ae.building_id = :bid `; args.bid = filter.buildingId; }
  if (filter.startDate) { sql += ` AND ae.attendance_date >= :start `; args.start = filter.startDate; }
  if (filter.endDate) { sql += ` AND ae.attendance_date <= :end `; args.end = filter.endDate; }
  
  sql += ` ORDER BY ae.captured_at DESC `;
  if (filter.limit) { sql += ` LIMIT :limit `; args.limit = filter.limit; }

  const rs = await database.execute({ sql, args });
  return rs.rows.map(r => ({ 
    ...mapAttendanceEvent(r as any), 
    fullName: String(r.fullName), 
    studentCode: String(r.studentCode) 
  }));
}

export async function listPhoneDetections(limitOrBid?: number | string | null, bid?: string | null) {
  const database = await ensureDatabaseReady();
  let limit = 50;
  let finalBid = bid;

  if (typeof limitOrBid === "number") {
    limit = limitOrBid;
  } else if (typeof limitOrBid === "string") {
    finalBid = limitOrBid;
  }

  let sql = `SELECT * FROM phone_detections WHERE 1=1 `;
  const args: any = { limit };
  if (finalBid) { sql += ` AND building_id = :bid `; args.bid = finalBid; }
  sql += ` ORDER BY detected_at DESC LIMIT :limit `;
  
  const rs = await database.execute({ sql, args });
  return rs.rows.map(r => ({ id: String(r.id), imageData: String(r.image_data), detectedAt: String(r.detected_at) }));
}

export async function restoreSystemBackup(data: any) {
    // Basic placeholder to satisfy build
}

export async function getScheduleWithAttendance(scheduleId: string, date: string) {
  const database = await ensureDatabaseReady();
  const rsSch = await database.execute({
    sql: `SELECT s.*, c.name as className FROM schedules s JOIN classes c ON c.id = s.class_id WHERE s.id = ? LIMIT 1`,
    args: [scheduleId]
  });
  if (!rsSch.rows[0]) return null;
  const sch = rsSch.rows[0];

  const rsRos = await database.execute({
    sql: `
      SELECT s.*, 
             (SELECT status FROM attendance_events ae WHERE ae.student_id = s.id AND ae.schedule_id = :sid AND ae.attendance_date = :date) as status,
             (SELECT notes FROM attendance_events ae WHERE ae.student_id = s.id AND ae.schedule_id = :sid AND ae.attendance_date = :date) as notes
      FROM students s 
      JOIN class_students cs ON cs.student_id = s.id 
      WHERE cs.class_id = :cid
    `,
    args: { sid: scheduleId, date, cid: String(sch.class_id) }
  });

  return {
    id: String(sch.id),
    className: String(sch.className),
    subject: String(sch.subject),
    students: rsRos.rows.map(r => ({ ...mapStudent(r as any), status: r.status ? String(r.status) : null, attendanceNotes: r.notes ? String(r.notes) : null }))
  };
}

export async function listClassStudents(classId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT s.* FROM students s JOIN class_students cs ON cs.student_id = s.id WHERE cs.class_id = ?`,
    args: [classId]
  });
  return rs.rows.map(r => mapStudent(r as any));
}

export async function getStudentAttendanceHistory(studentId: string, limit = 50) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT * FROM attendance_events WHERE student_id = ? ORDER BY captured_at DESC LIMIT ?`,
    args: [studentId, limit]
  });
  return rs.rows.map(r => mapAttendanceEvent(r as any));
}

export async function getStudentByUserId(userId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT * FROM students WHERE user_id = ? LIMIT 1`,
    args: [userId]
  });
  const row = rs.rows[0];
  return row ? mapStudent(row as any) : null;
}

export async function getStudentAttendanceSummary(studentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT 
            COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
            COUNT(CASE WHEN status = 'late' THEN 1 END) as late
          FROM attendance_events WHERE student_id = ?`,
    args: [studentId]
  });
  const r = rs.rows[0];
  const present = Number(r.present || 0);
  const late = Number(r.late || 0);
  const totalSchoolDays = 180; // Placeholder term length
  const percentage = Math.round((present / totalSchoolDays) * 100);

  return {
    present,
    late,
    presentDays: present,
    totalSchoolDays,
    percentage
  };
}

export async function getStudentAssignments(studentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT a.*, c.name as className,
             COALESCE(s.status, 'Not Submitted') as status,
             g.score
      FROM assignments a 
      JOIN classes c ON c.id = a.class_id 
      JOIN class_students cs ON cs.class_id = c.id 
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = cs.student_id
      LEFT JOIN grades g ON g.submission_id = s.id
      WHERE cs.student_id = ? AND (a.scheduled_at IS NULL OR a.scheduled_at <= datetime('now'))
      ORDER BY a.due_date ASC
    `,
    args: [studentId]
  });
  return rs.rows.map(r => ({
    id: String(r.id),
    title: String(r.title),
    description: r.description ? String(r.description) : null,
    dueDate: String(r.due_date),
    className: String(r.className),
    status: String(r.status),
    score: r.score !== null ? Number(r.score) : null,
    topic: r.topic ? String(r.topic) : null,
    type: r.assignment_type ? String(r.assignment_type) : "assignment",
    points: r.points !== null ? Number(r.points) : 100,
    attachmentUrl: r.attachment_url ? String(r.attachment_url) : null,
    attachmentName: r.attachment_name ? String(r.attachment_name) : null,
    scheduledAt: r.scheduled_at ? String(r.scheduled_at) : null
  }));
}

export async function getStudentAttendanceEvents(studentId: string, limit = 50) {
  return getStudentAttendanceHistory(studentId, limit);
}

export async function getTeacherAssignments(teacherId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT a.*, c.name as className,
             (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = a.class_id) as totalStudents,
             (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submittedCount
      FROM assignments a 
      JOIN classes c ON c.id = a.class_id 
      WHERE c.teacher_id = ?
      ORDER BY a.due_date ASC
    `,
    args: [teacherId]
  });
  return rs.rows.map(r => ({
    id: String(r.id),
    title: String(r.title),
    description: r.description ? String(r.description) : null,
    dueDate: String(r.due_date),
    className: String(r.className),
    totalStudents: Number(r.totalStudents || 0),
    submittedCount: Number(r.submittedCount || 0),
    topic: r.topic ? String(r.topic) : null,
    type: r.assignment_type ? String(r.assignment_type) : "assignment",
    points: r.points !== null ? Number(r.points) : 100,
    attachmentUrl: r.attachment_url ? String(r.attachment_url) : null,
    attachmentName: r.attachment_name ? String(r.attachment_name) : null,
    scheduledAt: r.scheduled_at ? String(r.scheduled_at) : null
  }));
}

export async function getTeacherSchedules(teacherId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT s.*, c.name as className 
      FROM schedules s 
      JOIN classes c ON c.id = s.class_id 
      WHERE s.teacher_id = ?
      ORDER BY s.day_of_week, s.start_time
    `,
    args: [teacherId]
  });
  return rs.rows.map(r => ({
    id: String(r.id),
    className: String(r.className),
    subject: String(r.subject),
    dayOfWeek: String(r.day_of_week),
    startTime: String(r.start_time),
    endTime: String(r.end_time)
  }));
}

export async function getSchoolwideStats(bid?: string | null) {
  const database = await ensureDatabaseReady();
  const today = toAttendanceDate(isoNow());
  
  // Class performance today
  let classSql = `
    SELECT 
      c.name,
      (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as total,
      (SELECT COUNT(*) FROM attendance_events ae WHERE ae.class_name_snapshot = c.name AND ae.attendance_date = :today) as present
    FROM classes c
    WHERE 1=1
  `;
  const args: any = { today };
  if (bid) { classSql += ` AND c.building_id = :bid `; args.bid = bid; }
  
  const rsClasses = await database.execute({ sql: classSql, args });
  const classPerformance = rsClasses.rows.map(r => {
    const total = Number(r.total || 1);
    const present = Number(r.present || 0);
    return {
      name: String(r.name),
      total,
      present,
      rate: Math.round((present / total) * 100)
    };
  });

  // Trends (Last 14 days)
  const trends: { date: string, count: number }[] = [];
  for (let i = 0; i < 14; i++) {
     const date = shiftDate(today, -i);
     let trendSql = `SELECT COUNT(*) as count FROM attendance_events WHERE attendance_date = :date`;
     const trendArgs: any = { date };
     if (bid) { trendSql += ` AND building_id = :bid `; trendArgs.bid = bid; }
     const rs = await database.execute({ sql: trendSql, args: trendArgs });
     trends.push({ date, count: Number(rs.rows[0]?.count || 0) });
  }

  return {
    classPerformance,
    trends
  };
}

// -------------------------------------------------------------
// Parent-Child Workflows
// -------------------------------------------------------------

export async function createParentStudentRequest(parentId: string, studentId: string) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  const now = isoNow();
  await database.execute({
    sql: `INSERT INTO parent_student_requests (id, parent_id, student_id, status, created_at) VALUES (?, ?, ?, 'pending', ?)`,
    args: [id, parentId, studentId, now]
  });
}

export async function listParentRequestsForStudent(studentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT p.id as requestId, u.id as parentUserId, u.full_name as parentName, u.email as parentEmail, u.phone as parentPhone, p.status, p.created_at as createdAt 
          FROM parent_student_requests p 
          JOIN users u ON u.id = p.parent_id 
          WHERE p.student_id = ?`,
    args: [studentId]
  });
  return rs.rows.map(r => ({
    id: String(r.requestId),
    parentUserId: String(r.parentUserId),
    parentName: String(r.parentName),
    parentEmail: String(r.parentEmail),
    parentPhone: r.parentPhone ? String(r.parentPhone) : null,
    status: String(r.status),
    createdAt: String(r.createdAt)
  }));
}

export async function getStudentApprovedParents(studentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT u.full_name as parentName, u.phone as parentPhone, u.email as parentEmail
          FROM parent_student_requests p
          JOIN users u ON u.id = p.parent_id
          WHERE p.student_id = ? AND p.status = 'approved'`,
    args: [studentId]
  });
  return rs.rows.map(r => ({
    name: String(r.parentName),
    phone: r.parentPhone ? String(r.parentPhone) : null,
    email: String(r.parentEmail)
  }));
}

export async function listParentRequestsForParent(parentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `SELECT p.id as requestId, s.id as studentId, s.full_name as studentName, s.student_code as studentCode, p.status, p.created_at as createdAt 
          FROM parent_student_requests p 
          JOIN students s ON s.id = p.student_id 
          WHERE p.parent_id = ?`,
    args: [parentId]
  });
  return rs.rows.map(r => ({
    id: String(r.requestId),
    studentId: String(r.studentId),
    studentName: String(r.studentName),
    studentCode: String(r.studentCode),
    status: String(r.status),
    createdAt: String(r.createdAt)
  }));
}

export async function updateParentRequestStatus(requestId: string, status: 'approved' | 'rejected') {
  const database = await ensureDatabaseReady();
  await database.execute({
    sql: `UPDATE parent_student_requests SET status = ? WHERE id = ?`,
    args: [status, requestId]
  });
}

export async function getStudentTeachers(studentId: string) {
  const database = await ensureDatabaseReady();
  const rs = await database.execute({
    sql: `
      SELECT t.full_name as fullName, c.name as className, c.subject
      FROM teachers t
      JOIN classes c ON c.teacher_id = t.id
      JOIN class_students cs ON cs.class_id = c.id
      WHERE cs.student_id = ?
    `,
    args: [studentId]
  });
  return rs.rows.map(r => ({
    fullName: String(r.fullName),
    className: String(r.className),
    subject: r.subject ? String(r.subject) : "General"
  }));
}

export async function insertAnnouncement(input: {
  title: string;
  content: string;
  targetRole: string;
  buildingId: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  scheduledAt?: string | null;
}) {
  const database = await ensureDatabaseReady();
  const id = randomUUID();
  await database.execute({
    sql: `INSERT INTO announcements (id, title, content, target_role, building_id, attachment_url, attachment_name, attachment_type, scheduled_at, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.title, input.content, input.targetRole, input.buildingId, input.attachmentUrl || null, input.attachmentName || null, input.attachmentType || null, input.scheduledAt || null, isoNow()]
  });
  return id;
}

export async function getBuildingAdmins(buildingId: string | null) {
  const database = await ensureDatabaseReady();
  let sql = `SELECT full_name as fullName, email FROM users WHERE role IN ('admin', 'owner')`;
  const args: any = [];
  if (buildingId) {
    sql += ` AND (building_id = ? OR role = 'owner')`;
    args.push(buildingId);
  } else {
    sql += ` AND role = 'owner'`;
  }
  const rs = await database.execute({ sql, args });
  return rs.rows.map(r => ({
    fullName: String(r.fullName),
    email: String(r.email)
  }));
}

export async function getLatestAnnouncementsForRole(role: string, buildingId: string | null, limit = 20) {
  const database = await ensureDatabaseReady();
  let sql = `SELECT * FROM announcements WHERE (target_role = ? OR target_role = 'all') AND (scheduled_at IS NULL OR scheduled_at <= datetime('now'))`;
  const args: any = [role];
  if (buildingId) {
    sql += ` AND (building_id = ? OR building_id IS NULL)`;
    args.push(buildingId);
  }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  args.push(limit);
  
  const rs = await database.execute({ sql, args });
  return rs.rows.map(row => mapAnnouncement(row as any));
}
