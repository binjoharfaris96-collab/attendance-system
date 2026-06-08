const Database = require('better-sqlite3');
(function(){
  try{
    const db = new Database('data/attendance.sqlite');
    const user = db.prepare('SELECT id,email FROM users WHERE email = ? LIMIT 1').get('fabinjwhar12028@kfs.sch.sa');
    if (!user) { console.log(JSON.stringify({ error: 'user_not_found' })); process.exit(0); }
    const prefix = 'fddb5f66';
    const matches = db.prepare('SELECT id,user_id,full_name,department FROM teachers WHERE LOWER(id) LIKE ?').all(prefix.toLowerCase() + '%');
    if (matches.length !== 1) { console.log(JSON.stringify({ error: matches.length===0 ? 'no_match' : 'multiple_matches', count: matches.length, matches }, null, 2)); process.exit(0); }
    const t = matches[0];
    db.prepare('UPDATE teachers SET user_id = ? WHERE id = ?').run(user.id, t.id);
    const updated = db.prepare('SELECT id,user_id,full_name,department FROM teachers WHERE id = ?').get(t.id);
    console.log(JSON.stringify({ linked: true, teacher: updated, user }, null, 2));
  } catch(e){ console.error(JSON.stringify({ error: e.message })); process.exit(1); }
})();
