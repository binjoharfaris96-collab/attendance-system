import "server-only";

import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";

import {
  DEMO_EMAIL_DOMAIN,
  DEMO_OWNER_EMAIL,
  DEMO_SEED_KEY,
  demoPhotoUrl,
  isDemoMode,
} from "@/lib/demo";
import { isoNow, shiftDate, toAttendanceDate } from "@/lib/time";

const FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Mason", "Sophia", "Ethan", "Isabella", "Lucas",
  "Mia", "Oliver", "Charlotte", "Elijah", "Amelia", "James", "Harper", "Benjamin", "Evelyn", "Alexander",
  "Abigail", "Henry", "Emily", "Sebastian", "Elizabeth", "Jack", "Sofia", "Aiden", "Avery", "Owen",
  "Ella", "Samuel", "Scarlett", "Matthew", "Grace", "Joseph", "Chloe", "Levi", "Victoria", "Mateo",
  "Riley", "David", "Aria", "John", "Lily", "Wyatt", "Aurora", "Carter", "Zoey", "Julian",
];

const LAST_NAMES = [
  "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Wilson",
  "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
  "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres",
  "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
];

const BUILDINGS = [
  { name: "Main Campus", address: "100 Education Blvd, Springfield", grades: "Administration" },
  { name: "Elementary Building", address: "200 Oak Lane, Springfield", grades: "K-5" },
  { name: "Middle School Building", address: "300 Maple Ave, Springfield", grades: "6-8" },
  { name: "High School Building", address: "400 Cedar Rd, Springfield", grades: "9-12" },
  { name: "STEM Center", address: "500 Innovation Way, Springfield", grades: "STEM Programs" },
] as const;

const BUILDING_SUBJECTS: Record<string, string[]> = {
  "Main Campus": ["Leadership", "Counseling", "Library Science"],
  "Elementary Building": ["Reading", "Mathematics", "Science", "Art", "Physical Education"],
  "Middle School Building": ["English", "Pre-Algebra", "Life Science", "World History", "Music"],
  "High School Building": ["AP English", "Calculus", "Chemistry", "US History", "Computer Science"],
  "STEM Center": ["Robotics", "Engineering", "Physics", "Data Science", "Programming"],
};

const DEPARTMENTS = [
  "Mathematics", "Science", "English", "Social Studies", "Arts", "Physical Education",
  "Technology", "Special Education", "Counseling", "Administration",
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const;
const TIME_SLOTS = [
  { start: "08:00", end: "08:50" },
  { start: "09:00", end: "09:50" },
  { start: "10:00", end: "10:50" },
  { start: "11:00", end: "11:50" },
  { start: "12:30", end: "13:20" },
  { start: "13:30", end: "14:20" },
];

const ANNOUNCEMENT_TEMPLATES = [
  { title: "Parent-Teacher Conference Week", content: "Conferences will be held March 10-14. Please schedule your appointment through the parent portal.", role: "parent" },
  { title: "Spring Break Reminder", content: "School will be closed April 7-11 for spring break. Classes resume Monday, April 14.", role: "all" },
  { title: "Science Fair Registration Open", content: "Students in grades 6-12 can now register for the annual science fair. Deadline: March 28.", role: "student" },
  { title: "Staff Development Day", content: "No classes on Friday. All teachers should report to the Main Campus auditorium at 8:00 AM.", role: "teacher" },
  { title: "New Attendance Policy", content: "Updated attendance guidelines are now in effect. Review the handbook for details on excused absences.", role: "all" },
  { title: "STEM Open House", content: "Join us Saturday at the STEM Center for demonstrations, robotics showcases, and lab tours.", role: "all" },
  { title: "Homework Support Sessions", content: "After-school tutoring is available Mon-Thu in the library from 3:00-4:30 PM.", role: "student" },
  { title: "Bus Route Changes", content: "Effective next Monday, routes 12 and 15 have updated pickup times. Check your email for details.", role: "parent" },
];

const ASSIGNMENT_TITLES = [
  "Chapter Review Worksheet", "Lab Report: Chemical Reactions", "Essay: Historical Analysis",
  "Problem Set #4", "Reading Comprehension Quiz", "Group Project Presentation",
  "Midterm Study Guide", "Creative Writing Assignment", "Data Analysis Project",
  "Research Paper Draft", "Vocabulary Test", "Geometry Proofs Practice",
];

const TEACHER_COMMENTS = [
  "Excellent work! Keep up the strong effort.",
  "Good progress. Review chapter 5 for the upcoming quiz.",
  "Please see me during office hours to discuss improvements.",
  "Outstanding analysis and attention to detail.",
  "Shows improvement. Continue practicing the concepts covered in class.",
  "Well-organized submission. Minor formatting corrections needed.",
];

const DUMMY_HASH = "$2b$12$demoseedhashnotusedforloginpurposes000000000000000000000";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPhone() {
  return `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${String(randomInt(1000, 9999))}`;
}

function fullName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function gradeForBuilding(buildingName: string, index: number): string {
  switch (buildingName) {
    case "Elementary Building":
      return `Grade ${(index % 6) + 1}`;
    case "Middle School Building":
      return `Grade ${(index % 3) + 6}`;
    case "High School Building":
      return `Grade ${(index % 4) + 9}`;
    case "STEM Center":
      return pick(["Grade 9", "Grade 10", "Grade 11", "Grade 12", "STEM Academy"]);
    default:
      return "N/A";
  }
}

async function clearAllData(db: Client) {
  const tables = [
    "grades", "submissions", "assignment_comments", "assignments",
    "rubric_criteria", "rubrics", "class_students", "schedules", "classes",
    "attendance_events", "misbehavior_reports", "absence_excuses",
    "parent_student_requests", "announcements", "students", "teachers",
    "users", "unknown_faces", "phone_detections", "buildings",
  ];
  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM ${table}`);
    } catch {
      // Table may not exist yet
    }
  }
}

async function getSettingDirect(db: Client, key: string, defaultValue: string) {
  const rs = await db.execute({ sql: "SELECT value FROM app_settings WHERE key = ?", args: [key] });
  return rs.rows[0] ? String(rs.rows[0].value) : defaultValue;
}

async function updateSettingDirect(db: Client, key: string, value: string) {
  await db.execute({
    sql: "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [key, value],
  });
}

export async function seedDemoDataIfNeeded(db: Client) {
  if (!isDemoMode()) return;

  const seeded = await getSettingDirect(db, DEMO_SEED_KEY, "");
  if (seeded === "true") return;

  await clearAllData(db);
  const now = isoNow();
  const today = toAttendanceDate(now);

  // --- Buildings ---
  const buildingIds: Record<string, string> = {};
  for (const b of BUILDINGS) {
    const id = randomUUID();
    buildingIds[b.name] = id;
    await db.execute({
      sql: "INSERT INTO buildings (id, name, address, grades, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [id, b.name, b.address, b.grades, now],
    });
  }

  const mainCampusId = buildingIds["Main Campus"];

  // --- Owner ---
  const ownerId = randomUUID();
  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, building_id, phone, photo_url)
          VALUES (?, ?, ?, ?, 'owner', ?, ?, ?, ?, ?)`,
    args: [ownerId, DEMO_OWNER_EMAIL, DUMMY_HASH, "Dr. Patricia Morrison", now, now, mainCampusId, randomPhone(), demoPhotoUrl("owner")],
  });
  await updateSettingDirect(db, "admin_email", DEMO_OWNER_EMAIL);

  // --- Admins (5) ---
  const adminIds: string[] = [];
  const adminNames = ["Robert Chen", "Sarah Mitchell", "David Okonkwo", "Lisa Nakamura", "Michael Torres"];
  for (let i = 0; i < 5; i++) {
    const id = randomUUID();
    const buildingName = BUILDINGS[i].name;
    adminIds.push(id);
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, building_id, phone, photo_url)
            VALUES (?, ?, ?, ?, 'admin', ?, ?, ?, ?, ?)`,
      args: [
        id, `admin${i + 1}@${DEMO_EMAIL_DOMAIN}`, DUMMY_HASH, adminNames[i],
        now, now, buildingIds[buildingName], randomPhone(), demoPhotoUrl(`admin${i + 1}`),
      ],
    });
  }

  // --- Teachers (15, 3 per building) ---
  const teacherRecords: { id: string; userId: string; buildingId: string; name: string }[] = [];
  let teacherIndex = 0;
  for (const b of BUILDINGS) {
    const subjects = BUILDING_SUBJECTS[b.name];
    for (let t = 0; t < 3; t++) {
      teacherIndex++;
      const userId = randomUUID();
      const teacherId = randomUUID();
      const name = fullName();
      teacherRecords.push({ id: teacherId, userId, buildingId: buildingIds[b.name], name });
      await db.execute({
        sql: `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, building_id, phone, photo_url)
              VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?, ?)`,
        args: [
          userId, `teacher${teacherIndex}@${DEMO_EMAIL_DOMAIN}`, DUMMY_HASH, name,
          now, now, buildingIds[b.name], randomPhone(), demoPhotoUrl(`teacher${teacherIndex}`),
        ],
      });
      await db.execute({
        sql: `INSERT INTO teachers (id, user_id, full_name, department, created_at, updated_at, building_id)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [teacherId, userId, name, pick(DEPARTMENTS), now, now, buildingIds[b.name]],
      });
    }
  }

  // --- Classes (4 per building) ---
  const classRecords: { id: string; buildingId: string; teacherId: string; name: string; subject: string }[] = [];
  for (const b of BUILDINGS) {
    const subjects = BUILDING_SUBJECTS[b.name];
    const buildingTeachers = teacherRecords.filter((t) => t.buildingId === buildingIds[b.name]);
    for (let c = 0; c < 4; c++) {
      const classId = randomUUID();
      const teacher = buildingTeachers[c % buildingTeachers.length];
      const subject = subjects[c % subjects.length];
      const className = `${b.name === "Elementary Building" ? "Grade" : "Section"} ${String.fromCharCode(65 + c)} - ${subject}`;
      classRecords.push({ id: classId, buildingId: buildingIds[b.name], teacherId: teacher.id, name: className, subject });
      await db.execute({
        sql: `INSERT INTO classes (id, name, teacher_id, subject, created_at, updated_at, building_id)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [classId, className, teacher.id, subject, now, now, buildingIds[b.name]],
      });
    }
  }

  // --- Students (50) ---
  const studentRecords: { id: string; userId: string; buildingId: string; name: string; code: string }[] = [];
  const buildingDistribution = [
    { name: "Elementary Building", count: 12 },
    { name: "Middle School Building", count: 12 },
    { name: "High School Building", count: 14 },
    { name: "STEM Center", count: 12 },
  ];
  let studentIndex = 0;
  for (const dist of buildingDistribution) {
    for (let s = 0; s < dist.count; s++) {
      studentIndex++;
      const userId = randomUUID();
      const studentId = randomUUID();
      const name = fullName();
      const code = `STU${String(studentIndex).padStart(4, "0")}`;
      const grade = gradeForBuilding(dist.name, s);
      const parentName = fullName();
      const buildingId = buildingIds[dist.name];
      const lates = randomInt(0, 8);
      const excuses = randomInt(0, 3);

      studentRecords.push({ id: studentId, userId, buildingId, name, code });
      await db.execute({
        sql: `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, building_id, phone, photo_url)
              VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
        args: [
          userId, `student${studentIndex}@${DEMO_EMAIL_DOMAIN}`, DUMMY_HASH, name,
          now, now, buildingId, null, demoPhotoUrl(`student${studentIndex}`),
        ],
      });
      await db.execute({
        sql: `INSERT INTO students (id, user_id, student_code, full_name, class_name, photo_url, lates_count, excuses_count, break_lates_count, created_at, updated_at, date_of_birth, parent_name, parent_phone, building_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          studentId, userId, code, name, grade, demoPhotoUrl(`student${studentIndex}`),
          lates, excuses, randomInt(0, 2), now, now,
          `${2008 + randomInt(0, 10)}-${String(randomInt(1, 12)).padStart(2, "0")}-${String(randomInt(1, 28)).padStart(2, "0")}`,
          parentName, randomPhone(), buildingId,
        ],
      });

      // Enroll in building classes + 1 cross-building class
      const buildingClasses = classRecords.filter((c) => c.buildingId === buildingId);
      const enrollClasses = pickN(buildingClasses, Math.min(3, buildingClasses.length));
      for (const cls of enrollClasses) {
        await db.execute({
          sql: "INSERT OR IGNORE INTO class_students (class_id, student_id) VALUES (?, ?)",
          args: [cls.id, studentId],
        });
      }
    }
  }

  // --- Parents (30) ---
  const parentIds: string[] = [];
  for (let p = 0; p < 30; p++) {
    const id = randomUUID();
    const name = fullName();
    const buildingName = BUILDINGS[p % BUILDINGS.length].name;
    parentIds.push(id);
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at, building_id, phone, photo_url)
            VALUES (?, ?, ?, ?, 'parent', ?, ?, ?, ?, ?)`,
      args: [
        id, `parent${p + 1}@${DEMO_EMAIL_DOMAIN}`, DUMMY_HASH, name,
        now, now, buildingIds[buildingName], randomPhone(), demoPhotoUrl(`parent${p + 1}`),
      ],
    });
  }

  // Link parents to children (1-2 children each)
  const linkedStudents = new Set<string>();
  for (let p = 0; p < parentIds.length; p++) {
    const childCount = p < 20 ? 1 : 2;
    const available = studentRecords.filter((s) => !linkedStudents.has(s.id) || childCount > 1);
    const children = pickN(available.length > 0 ? available : studentRecords, childCount);
    for (const child of children) {
      linkedStudents.add(child.id);
      await db.execute({
        sql: "INSERT INTO parent_student_requests (id, parent_id, student_id, status, created_at) VALUES (?, ?, ?, 'approved', ?)",
        args: [randomUUID(), parentIds[p], child.id, now],
      });
    }
  }

  // --- Schedules ---
  for (const cls of classRecords) {
    const dayCount = randomInt(2, 4);
    const selectedDays = pickN(DAYS, dayCount);
    for (let d = 0; d < selectedDays.length; d++) {
      const slot = TIME_SLOTS[d % TIME_SLOTS.length];
      await db.execute({
        sql: `INSERT INTO schedules (id, class_id, teacher_id, subject, day_of_week, start_time, end_time, created_at, building_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [randomUUID(), cls.id, cls.teacherId, cls.subject, selectedDays[d], slot.start, slot.end, now, cls.buildingId],
      });
    }
  }

  // --- Assignments, Submissions, Grades ---
  for (const cls of classRecords) {
    const assignmentCount = randomInt(3, 5);
    const enrolledResult = await db.execute({
      sql: "SELECT student_id FROM class_students WHERE class_id = ?",
      args: [cls.id],
    });
    const enrolledStudentIds = enrolledResult.rows.map((r) => String(r.student_id));

    for (let a = 0; a < assignmentCount; a++) {
      const assignmentId = randomUUID();
      const dueDate = shiftDate(today, randomInt(-14, 21));
      const title = pick(ASSIGNMENT_TITLES);
      await db.execute({
        sql: `INSERT INTO assignments (id, class_id, title, description, due_date, created_at, updated_at, building_id, topic, assignment_type, points, accepting_submissions)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'assignment', 100, 1)`,
        args: [
          assignmentId, cls.id, title,
          `Complete the ${title.toLowerCase()} for ${cls.subject}. Submit by the due date.`,
          dueDate, now, now, cls.buildingId, cls.subject,
        ],
      });

      for (const studentId of enrolledStudentIds) {
        const isPastDue = dueDate < today;
        const submitted = isPastDue ? Math.random() > 0.15 : Math.random() > 0.4;
        if (!submitted) continue;

        const submissionId = randomUUID();
        const status = isPastDue && Math.random() > 0.2 ? "Graded" : "Submitted";
        await db.execute({
          sql: `INSERT INTO submissions (id, assignment_id, student_id, status, submitted_at, building_id, content)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [submissionId, assignmentId, studentId, status, now, cls.buildingId, "Submitted work for review."],
        });

        if (status === "Graded") {
          const score = randomInt(65, 100);
          await db.execute({
            sql: "INSERT INTO grades (id, submission_id, score, feedback, graded_at, building_id) VALUES (?, ?, ?, ?, ?, ?)",
            args: [randomUUID(), submissionId, score, pick(TEACHER_COMMENTS), now, cls.buildingId],
          });
        }
      }

      // Teacher comment on assignment
      const teacher = teacherRecords.find((t) => t.id === cls.teacherId);
      if (teacher) {
        await db.execute({
          sql: "INSERT INTO assignment_comments (id, assignment_id, author_id, content, created_at, building_id) VALUES (?, ?, ?, ?, ?, ?)",
          args: [randomUUID(), assignmentId, teacher.userId, pick(TEACHER_COMMENTS), now, cls.buildingId],
        });
      }
    }
  }

  // --- Attendance Events (45 school days of history, batched) ---
  const attendanceBatch: { sql: string; args: unknown[] }[] = [];
  for (const student of studentRecords) {
    const studentClassResult = await db.execute({
      sql: "SELECT class_name FROM students WHERE id = ?",
      args: [student.id],
    });
    const classLabel = studentClassResult.rows[0]?.class_name ? String(studentClassResult.rows[0].class_name) : null;

    for (let d = 45; d >= 0; d--) {
      const date = shiftDate(today, -d);
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 5 || dayOfWeek === 6) continue;

      const roll = Math.random();
      let status: string;
      if (roll < 0.08) status = "absent";
      else if (roll < 0.15) status = "late";
      else status = "present";

      if (status === "absent") continue;

      attendanceBatch.push({
        sql: `INSERT INTO attendance_events (id, student_id, student_code_snapshot, full_name_snapshot, class_name_snapshot, source, status, attendance_date, captured_at, building_id)
              VALUES (?, ?, ?, ?, ?, 'demo_seed', ?, ?, ?, ?)`,
        args: [randomUUID(), student.id, student.code, student.name, classLabel, status, date, now, student.buildingId],
      });
    }
  }
  for (let i = 0; i < attendanceBatch.length; i += 100) {
    await db.batch(attendanceBatch.slice(i, i + 100), "write");
  }

  // --- Announcements ---
  for (const b of BUILDINGS) {
    const buildingId = buildingIds[b.name];
    const templates = pickN(ANNOUNCEMENT_TEMPLATES, 3);
    for (const tmpl of templates) {
      await db.execute({
        sql: "INSERT INTO announcements (id, title, content, target_role, created_at, building_id, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [randomUUID(), tmpl.title, tmpl.content, tmpl.role, now, buildingId, ownerId],
      });
    }
  }

  // --- Absence excuses for some students ---
  const excuseStudents = pickN(studentRecords, 10);
  for (const student of excuseStudents) {
    await db.execute({
      sql: "INSERT INTO absence_excuses (id, student_id, reason, excuse_date, created_at, building_id) VALUES (?, ?, ?, ?, ?, ?)",
      args: [randomUUID(), student.id, pick(["Medical appointment", "Family emergency", "School activity", "Religious observance"]), shiftDate(today, -randomInt(1, 30)), now, student.buildingId],
    });
  }

  await updateSettingDirect(db, DEMO_SEED_KEY, "true");
  console.log("[demo] Seeded demo data: 50 students, 15 teachers, 30 parents, 5 admins, 1 owner, 5 buildings");
}

export async function getRandomDemoUserEmail(role: string): Promise<string | null> {
  const { ensureDatabaseReady } = await import("@/lib/db");
  const db = await ensureDatabaseReady();

  if (role === "owner") {
    return DEMO_OWNER_EMAIL;
  }

  const rs = await db.execute({
    sql: `SELECT email FROM users WHERE role = ? AND email LIKE ? ORDER BY RANDOM() LIMIT 1`,
    args: [role, `%@${DEMO_EMAIL_DOMAIN}`],
  });

  return rs.rows[0] ? String(rs.rows[0].email) : null;
}
