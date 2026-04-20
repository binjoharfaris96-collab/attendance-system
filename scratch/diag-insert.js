import { createStudent, ensureDatabaseReady } from "./lib/db.js";

async function diag() {
  console.log("Starting diagnostic insert...");
  try {
    await ensureDatabaseReady();
    console.log("DB Ready.");
    
    const result = await createStudent({
      studentCode: "DIAG-" + Date.now(),
      fullName: "Diagnostic Test",
      className: "Test Class",
      buildingId: null
    });
    
    console.log("Insert successful!", result.id);
  } catch (err) {
    console.error("DIAGNOSTIC FAILED!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
  }
}

diag();
