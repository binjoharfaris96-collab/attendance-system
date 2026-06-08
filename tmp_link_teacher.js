const Database = require('better-sqlite3');
(function(){
  try{
    const db = new Database('data/attendance.sqlite', { readonly: false });
    const userRow = db.prepare('SELECT id,email,full_name,role,building_id FROM users WHERE email = ? LIMIT 1').get('fabinjwhar12028@kfs.sch.sa');
    const teachers = db.prepare('SELECT id,user_id,full_name,department,building_id FROM teachers ORDER BY id').all();
    const classes = db.prepare('SELECT id,name,subject,teacher_id FROM classes ORDER BY id').all();
    const unlinked = teachers.filter(t => t.user_id === null || t.user_id === undefined || t.user_id === '');
    const bioClasses = classes.filter(c => (c.name||'').toLowerCase().includes('bio') || (c.subject||'').toLowerCase().includes('bio'));

    // Try to find a single unlinked teacher who owns a bio class
    let linkedResult = null;
    if (userRow && unlinked.length === 1) {
      const candidate = unlinked[0];
      const classesForCandidate = classes.filter(c => c.teacher_id == candidate.id);
      const hasBio = classesForCandidate.some(c => (c.name||'').toLowerCase().includes('bio') || (c.subject||'').toLowerCase().includes('bio'));
      if (hasBio) {
        // perform update
        db.prepare('UPDATE teachers SET user_id = ? WHERE id = ?').run(userRow.id, candidate.id);
        linkedResult = { linked: true, teacherId: candidate.id, userId: userRow.id };
      }
    }

    const out = { user: userRow || null, teachers, unlinkedTeachers: unlinked, classes, bioClasses, linkedResult };
    console.log(JSON.stringify(out, null, 2));
  } catch(e) { console.error(e); process.exitCode=1; }
})();
