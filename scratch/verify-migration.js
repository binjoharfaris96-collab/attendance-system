import { ensureDatabaseReady, getDatabase } from "./lib/db.js";

async function verify() {
  console.log("Starting database verification...");
  try {
    const db = await ensureDatabaseReady();
    console.log("Database initialized and migrations run.");
    
    const rs = await db.execute("PRAGMA table_info(students);");
    console.log("\nStudent Table Structure:");
    rs.rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`);
    });
    
    console.log("\nVerification complete.");
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

verify();
