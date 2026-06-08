const { createClient } = require('@libsql/client');
(async ()=>{
  const client = createClient({ url: 'file:data/attendance.sqlite' });
  try {
    const email = 'fabinjwhar12028@kfs.sch.sa';
    const sql = `SELECT id,email,full_name,role,building_id FROM users WHERE email = '${email}' LIMIT 1`;
    const res = await client.execute(sql);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) { console.error(e); process.exitCode=1; }
})();
