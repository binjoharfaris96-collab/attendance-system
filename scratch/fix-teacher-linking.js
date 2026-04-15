const { createClient } = require("@libsql/client");
const { join } = require("node:path");

async function run() {
  const url = `file:${join(process.cwd(), "data", "attendance.sqlite")}`;
  const client = createClient({ url });
  
  // 1. Re-initialize tables just in case
  await client.execute(`
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
  
  const targetEmail = "fabinjwhar2028@kfs.sch.sa";
  const fallbackEmail = "binjoharf@gmail.com";
  
  console.log(`Checking for user ${targetEmail} or ${fallbackEmail}...`);
  
  const userRs = await client.execute({
    sql: "SELECT id, email, full_name FROM users WHERE email = :email OR email = :fallback",
    args: { email: targetEmail, fallback: fallbackEmail }
  });
  
  if (userRs.rows.length === 0) {
     console.log("No user found with those emails. Creating dummy user for testing...");
     const dummyId = require("node:crypto").randomUUID();
     await client.execute({
       sql: "INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
       args: [dummyId, targetEmail, 'OAUTH_LOGIN', 'Faris Binjohar', 'teacher', new Date().toISOString(), new Date().toISOString()]
     });
     userRs.rows.push({ id: dummyId, email: targetEmail, full_name: 'Faris Binjohar' });
  }

  const user = userRs.rows[0];
  const userId = String(user.id);
  const fullName = String(user.full_name);
  
  console.log(`Linking user ${user.email} (ID: ${userId}) to teacher profile.`);
  
  // Upsert teacher
  const teacherId = require("node:crypto").randomUUID();
  const now = new Date().toISOString();
  
  // Try to find existing teacher with same name
  const existingRs = await client.execute({
    sql: "SELECT id FROM teachers WHERE full_name = ?",
    args: [fullName]
  });
  
  if (existingRs.rows.length > 0) {
    const tid = String(existingRs.rows[0].id);
    await client.execute({
      sql: "UPDATE teachers SET user_id = ?, updated_at = ? WHERE id = ?",
      args: [userId, now, tid]
    });
    console.log(`Updated teacher ${tid}`);
  } else {
    await client.execute({
      sql: "INSERT INTO teachers (id, user_id, full_name, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [teacherId, userId, fullName, 'Faculty', now, now]
    });
    console.log(`Created new teacher ${teacherId}`);
  }
  
  console.log("DONE");
  await client.close();
}

run().catch(console.error);
