import { ensureDatabaseReady } from "./lib/db";
import { randomUUID } from "node:crypto";

async function run() {
  const database = await ensureDatabaseReady();
  const targetEmail = "fabinjwhar2028@kfs.sch.sa";
  
  console.log(`Searching for user with email: ${targetEmail}`);
  
  const userRs = await database.execute({
    sql: "SELECT id, full_name FROM users WHERE email = :email",
    args: { email: targetEmail }
  });
  
  const user = userRs.rows[0];
  if (!user) {
    console.error("User not found!");
    process.exit(1);
  }
  
  const userId = String(user.id);
  const fullName = String(user.full_name);
  
  console.log(`Found user: ${fullName} (ID: ${userId})`);
  
  // Check if teacher record exists
  const teacherRs = await database.execute({
    sql: "SELECT id FROM teachers WHERE user_id = :userId OR full_name = :fullName",
    args: { userId, fullName }
  });
  
  const existingTeacher = teacherRs.rows[0];
  
  if (existingTeacher) {
    console.log(`Updating existing teacher record (ID: ${existingTeacher.id}) to link with userId.`);
    await database.execute({
      sql: "UPDATE teachers SET user_id = :userId WHERE id = :id",
      args: { userId, id: String(existingTeacher.id) }
    });
  } else {
    console.log("Creating new teacher record and linking to user.");
    const teacherId = randomUUID();
    await database.execute({
      sql: `INSERT INTO teachers (id, user_id, full_name, department) 
            VALUES (:teacherId, :userId, :fullName, 'Faculty')`,
      args: { teacherId, userId, fullName }
    });
  }
  
  console.log("Teacher account linked successfully!");
}

run().catch(console.error);
