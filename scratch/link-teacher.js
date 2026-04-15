const { createClient } = require("@libsql/client");
const { join } = require("node:path");
const { crypto } = require("node:crypto");

async function run() {
  const url = `file:${join(process.cwd(), "data", "attendance.sqlite")}`;
  console.log(`Connecting to database at: ${url}`);
  
  const client = createClient({ url });
  const targetEmail = "fabinjwhar2028@kfs.sch.sa";
  
  console.log(`Searching for user with email: ${targetEmail}`);
  
  const userRs = await client.execute({
    sql: "SELECT id, full_name FROM users WHERE email = :email",
    args: { email: targetEmail }
  });
  
  const user = userRs.rows[0];
  if (!user) {
    console.error("User not found! Please ensure you have signed up in the app first.");
    process.exit(1);
  }
  
  const userId = String(user.id || user.id); // row properties might differ depending on driver
  const fullName = String(user.full_name || user.fullName);
  
  console.log(`Found user: ${fullName} (ID: ${userId})`);
  
  // Check if teacher record exists
  const teacherRs = await client.execute({
    sql: "SELECT id FROM teachers WHERE user_id = :userId OR full_name = :fullName",
    args: { userId, fullName }
  });
  
  const existingTeacher = teacherRs.rows[0];
  
  if (existingTeacher) {
    const teacherId = String(existingTeacher.id);
    console.log(`Updating existing teacher record (ID: ${teacherId}) to link with userId.`);
    await client.execute({
      sql: "UPDATE teachers SET user_id = :userId WHERE id = :id",
      args: { userId, id: teacherId }
    });
  } else {
    console.log("Creating new teacher record and linking to user.");
    const teacherId = require("node:crypto").randomUUID();
    await client.execute({
      sql: `INSERT INTO teachers (id, user_id, full_name, department) 
            VALUES (:teacherId, :userId, :fullName, 'Faculty')`,
      args: { teacherId, userId, fullName }
    });
  }
  
  console.log("Teacher account linked successfully! You can now access the teacher portal.");
  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
