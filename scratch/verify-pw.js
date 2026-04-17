const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');
const client = createClient({ url: 'file:data/attendance.sqlite' });

async function verify() {
  const email = 'binjoharf@gmail.com';
  const password = 'admin123';
  
  try {
    const res = await client.execute({
      sql: 'SELECT password_hash FROM users WHERE email = ?',
      args: [email]
    });
    
    if (res.rows.length === 0) {
      console.log('User not found in DB!');
      return;
    }
    
    const hash = res.rows[0].password_hash;
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Password verification for ${email} with hash "${hash}":`, isValid);
    
    if (!isValid) {
      console.log('UPDATING PASSWORD HASH...');
      const newHash = await bcrypt.hash(password, 12);
      await client.execute({
        sql: 'UPDATE users SET password_hash = ? WHERE email = ?',
        args: [newHash, email]
      });
      console.log('Password hash updated successfully.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

verify();
