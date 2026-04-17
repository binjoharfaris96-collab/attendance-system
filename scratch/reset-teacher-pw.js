const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');
const client = createClient({ url: 'file:data/attendance.sqlite' });

async function run() {
  const email = 'fabinjwhar2028@kfs.sch.sa';
  const password = 'teacher123';
  
  try {
    const hash = await bcrypt.hash(password, 12);
    await client.execute({
      sql: "UPDATE users SET password_hash = ? WHERE email = ?",
      args: [hash, email]
    });
    console.log(`Password reset for ${email} to 'teacher123'`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();
