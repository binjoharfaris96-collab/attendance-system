const { createClient } = require("@libsql/client");
const { join } = require("node:path");

async function run() {
  const url = `file:${join(process.cwd(), "data", "attendance.sqlite")}`;
  const client = createClient({ url });
  
  const emails = ["fabinjwhar2028@kfs.sch.sa", "fabinjwhar2028@KFS.SCH.SA", "binjoharf@gmail.com"];
  const name = "Faris Bin Johar";
  
  console.log("Ensuring User and Teacher records exist for: " + emails[0]);
  
  // 1. Ensure tables
  await client.execute(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT DEFAULT 'admin', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
  await client.execute(`CREATE TABLE IF NOT EXISTS teachers (id TEXT PRIMARY KEY, user_id TEXT UNIQUE, full_name TEXT NOT NULL, department TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL)`);

  let userId;
  
  // 2. Check for user
  const userRs = await client.execute({
    sql: "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
    args: [emails[0]]
  });
  
  if (userRs.rows.length > 0) {
    userId = String(userRs.rows[0].id);
    console.log("User already exists with ID: " + userId);
  } else {
    userId = require("node:crypto").randomUUID();
    await client.execute({
      sql: "INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [userId, emails[0], 'OAUTH_LOGIN', name, 'teacher', new Date().toISOString(), new Date().toISOString()]
    });
    console.log("Created new user with ID: " + userId);
  }

  // 3. Ensure teacher profile
  const teacherRs = await client.execute({
    sql: "SELECT id FROM teachers WHERE user_id = ? OR full_name = ?",
    args: [userId, name]
  });
  
  if (teacherRs.rows.length > 0) {
    const teacherId = String(teacherRs.rows[0].id);
    await client.execute({
      sql: "UPDATE teachers SET user_id = ?, full_name = ?, updated_at = ? WHERE id = ?",
      args: [userId, name, new Date().toISOString(), teacherId]
    });
    console.log("Updated existing teacher: " + teacherId);
  } else {
    const teacherId = require("node:crypto").randomUUID();
    await client.execute({
      sql: "INSERT INTO teachers (id, user_id, full_name, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [teacherId, userId, name, 'Faculty', new Date().toISOString(), new Date().toISOString()]
    });
    console.log("Created new teacher: " + teacherId);
  }

  console.log("SUCCESS: Account Linked.");
  await client.close();
}

run().catch(console.error);
