const { createClient } = require('@libsql/client');
(async ()=>{
  const client = createClient({ url: 'file:data/attendance.sqlite' });
  try {
    const u = await client.execute('SELECT id,email,full_name,role FROM users WHERE email = ? LIMIT 1', { args: ['fabinjwhar12028@kfs.sch.sa'] });
    const user = u.rows[0] || null;
    const teacherByUserId = user ? (await client.execute('SELECT * FROM teachers WHERE user_id = ? LIMIT 1', { args: [user.id] })).rows[0] || null : null;
    const bioClasses = (await client.execute("SELECT * FROM classes WHERE lower(name) LIKE '%bio%' OR lower(subject) LIKE '%bio%'")).rows || [];
    const classesForTeacher = teacherByUserId ? (await client.execute('SELECT * FROM classes WHERE teacher_id = ?', { args: [teacherByUserId.id] })).rows : [];
    console.log(JSON.stringify({ user, teacherByUserId, bioClasses, classesForTeacher }, null, 2));
  } catch(e) { console.error(e); process.exitCode=1; }
})();
