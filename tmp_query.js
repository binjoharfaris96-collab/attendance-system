const { createClient } = require('@libsql/client');
(async ()=>{
  const client = createClient({ url: 'file:data/attendance.sqlite' });
  try {
    const users = await client.execute('SELECT id,email,full_name,role,building_id FROM users ORDER BY created_at DESC LIMIT 200;');
    const teachers = await client.execute('SELECT id,user_id,full_name,building_id FROM teachers ORDER BY created_at DESC LIMIT 200;');
    const classes = await client.execute('SELECT id,name,teacher_id FROM classes ORDER BY created_at DESC LIMIT 200;');
    console.log(JSON.stringify({ users: users.rows, teachers: teachers.rows, classes: classes.rows }, null, 2));
  } catch(e) { console.error(e); process.exitCode=1; }
})();
