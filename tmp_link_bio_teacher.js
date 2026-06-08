const Database = require('better-sqlite3');
(function(){
  try{
    const db = new Database('data/attendance.sqlite');
    const userRow = db.prepare('SELECT id,email FROM users WHERE email = ? LIMIT 1').get('fabinjwhar12028@kfs.sch.sa');
    if (!userRow) { console.log(JSON.stringify({ error: 'user_not_found' })); process.exit(0); }

    const teachers = db.prepare('SELECT id,user_id,full_name,department,building_id FROM teachers ORDER BY id').all();
    const classes = db.prepare('SELECT id,name,subject,teacher_id FROM classes ORDER BY id').all();

    // find candidate teacher: unlinked and linked to a bio class or department
    const candidate = teachers.find(t => (!t.user_id || t.user_id === '') && (
      (t.department && t.department.toLowerCase().includes('bio')) ||
      classes.some(c => c.teacher_id == t.id && ((c.name||'').toLowerCase().includes('bio') || (c.subject||'').toLowerCase().includes('bio')))
    ));

    if (!candidate) {
      console.log(JSON.stringify({ error: 'no_candidate_found', user: userRow, teachers, classes }, null, 2));
      process.exit(0);
    }

    db.prepare('UPDATE teachers SET user_id = ? WHERE id = ?').run(userRow.id, candidate.id);
    const updated = db.prepare('SELECT id,user_id,full_name,department FROM teachers WHERE id = ?').get(candidate.id);
    console.log(JSON.stringify({ linked: true, teacher: updated, user: userRow }, null, 2));
  } catch(e){ console.error(JSON.stringify({ error: e.message })); process.exit(1); }
})();
