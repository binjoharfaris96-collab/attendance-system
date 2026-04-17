const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const client = createClient({ url: 'file:data/attendance.sqlite' });

async function run() {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 12);
    const emails = [
      'binjoharf@gmail.com',
      'binjowarf@gmail.com',
      'binjoharfaris96@gmail.com',
      'admin@kfs.sch.sa'
    ];

    console.log('--- ADMIN RECOVERY SCRIPT (FIXED QUOTES) ---');
    for (const email of emails) {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user exists
      const check = await client.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: [normalizedEmail]
      });

      if (check.rows.length > 0) {
        // Update password - USE SINGLE QUOTES for 'admin'
        await client.execute({
          sql: "UPDATE users SET password_hash = ?, role = 'admin' WHERE email = ?",
          args: [hash, normalizedEmail]
        });
        console.log(`UPDATED existing user: ${normalizedEmail}`);
      } else {
        // Create user
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await client.execute({
          sql: "INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, 'admin', ?, ?)",
          args: [id, normalizedEmail, hash, 'System Administrator', now, now]
        });
        console.log(`CREATED new admin user: ${normalizedEmail}`);
      }
    }
    console.log('\nAll administrator accounts are now set to password: admin123');
    console.log('--- END ---');
  } catch (e) {
    console.error('Database Error:', e);
  } finally {
    await client.close();
  }
}
run();
