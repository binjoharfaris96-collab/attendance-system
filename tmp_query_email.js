const { createClient } = require('@libsql/client');
(async ()=>{
  const client = createClient({ url: 'file:data/attendance.sqlite' });
  try {
    const res = await client.execute('SELECT id,email,full_name,role,building_id FROM users WHERE email = ? LIMIT 1', { args: ['fabinjwhar12028@kfs.sch.sa'] });
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) { console.error(e); process.exitCode=1; }
})();
