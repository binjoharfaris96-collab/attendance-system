import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL || "file:attendance.db",
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  console.log("Running migrations...");
  try {
     await db.execute("ALTER TABLE users ADD COLUMN phone TEXT");
     console.log("Added phone to users");
  } catch (e) {
     console.log("Could not add phone (maybe already exists):", e.message);
  }
  
  try {
     await db.execute("ALTER TABLE buildings ADD COLUMN grades TEXT");
     console.log("Added grades to buildings");
  } catch (e) {
     console.log("Could not add grades:", e.message);
  }
  
  // also create the parent requests table just in case it was swallowed
  try {
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
      console.log("Ensured parent_student_requests exists");
  } catch (e) {
      console.log("Could not create parent_student_requests:", e.message);
  }

  process.exit(0);
}

run();
