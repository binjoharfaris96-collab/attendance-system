import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL || "file:attendance.db",
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  try {
     const rs = await db.execute("PRAGMA table_info(users)");
     console.log("Users columns:", rs.rows.map(r => r.name));
  } catch (e) {
     console.log("Error:", e);
  }
}

run();
