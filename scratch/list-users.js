const { createClient } = require("@libsql/client");
const { join } = require("node:path");

async function run() {
  const url = `file:${join(process.cwd(), "data", "attendance.sqlite")}`;
  const client = createClient({ url });
  
  const rs = await client.execute("SELECT id, email, full_name, role FROM users LIMIT 10");
  console.log("Current users in DB:");
  console.table(rs.rows);
  
  await client.close();
}

run().catch(console.error);
