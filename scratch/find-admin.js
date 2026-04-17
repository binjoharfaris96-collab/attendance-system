const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:data/attendance.sqlite' });

async function run() {
  try {
    // Check tables first
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables:', tables.rows.map(r => r.name));

    // Get table info for users
    const schema = await client.execute("PRAGMA table_info(users)");
    console.log('Users Schema:', schema.rows.map(r => r.name));

    // Find admins - using single quotes for the string literal
    const res = await client.execute("SELECT email, role FROM users WHERE role = 'admin'");
    console.log('--- ADMIN USERS ---');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('--- END ---');
  } catch (e) {
    console.error('Database Error:', e);
  } finally {
    await client.close();
  }
}
run();
