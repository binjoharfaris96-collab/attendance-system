const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:data/attendance.sqlite' });

async function run() {
  try {
    const res = await client.execute("SELECT email, role FROM users");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();
