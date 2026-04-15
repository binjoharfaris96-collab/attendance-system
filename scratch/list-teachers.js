const { createClient } = require("@libsql/client");
const { join } = require("node:path");

async function run() {
  const url = `file:${join(process.cwd(), "data", "attendance.sqlite")}`;
  const client = createClient({ url });
  
  const rs = await client.execute("SELECT * FROM teachers");
  console.log("Current teachers in DB:");
  console.table(rs.rows);
  
  await client.close();
}

run().catch(console.error);
