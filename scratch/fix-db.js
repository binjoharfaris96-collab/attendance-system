const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:data/attendance.sqlite' });

async function run() {
  console.log('--- DB SCHEMA COMPLETE FIX START ---');
  try {
    const tables = [
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
        user_id TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE,
        full_name TEXT NOT NULL,
        department TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        subject TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS class_students (
        class_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        PRIMARY KEY (class_id, student_id)
      )`,
      `CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        file_url TEXT,
        status TEXT NOT NULL,
        submitted_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL UNIQUE,
        score REAL,
        feedback TEXT,
        graded_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS attendance_events (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_code_snapshot TEXT NOT NULL,
        full_name_snapshot TEXT NOT NULL,
        class_name_snapshot TEXT,
        source TEXT NOT NULL,
        notes TEXT,
        attendance_date TEXT NOT NULL,
        captured_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        target_role TEXT NOT NULL DEFAULT 'all',
        created_at TEXT NOT NULL
      )`
    ];

    for (const sql of tables) {
      const match = sql.match(/IF NOT EXISTS (\w+)/);
      if (!match) continue;
      const tableName = match[1];
      try {
        await client.execute(sql);
        console.log(`✓ Table ensured: ${tableName}`);
      } catch (e) {
        console.error(`✗ Error creating table ${tableName}:`, e.message);
      }
    }

    const currentTables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Final Tables:', currentTables.rows.map(r => r.name));

  } catch (e) {
    console.error('Fatal Fix Error:', e);
  } finally {
    await client.close();
    console.log('--- DB SCHEMA COMPLETE FIX END ---');
  }
}

run();
