const Database = require('better-sqlite3');
(function(){
  try{
    const db = new Database('data/attendance.sqlite', { readonly: true });
    const rows = db.prepare(`SELECT t.id, t.user_id, t.full_name, t.department, t.building_id, u.email AS user_email FROM teachers t LEFT JOIN users u ON u.id = t.user_id ORDER BY t.full_name ASC`).all();
    console.log(JSON.stringify(rows, null, 2));
  } catch(e){ console.error(JSON.stringify({ error: e.message })); process.exit(1); }
})();
