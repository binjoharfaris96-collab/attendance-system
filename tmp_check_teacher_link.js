const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'data', 'attendance.sqlite');
const email = process.argv[2] || 'fabinjwhar12028@kfs.sch.sa';
const db = new Database(dbPath, { readonly: true });

function safe(obj){ return obj ? JSON.stringify(obj, null, 2) : 'null'; }

const user = db.prepare('SELECT id, email, full_name FROM users WHERE email = ? LIMIT 1').get(email);
console.log('USER_LOOKUP:', email);
console.log(safe(user));

if (user) {
  const teacherByUser = db.prepare('SELECT id, full_name, department, user_id FROM teachers WHERE user_id = ? LIMIT 1').get(user.id);
  console.log('\nTEACHER_BY_USER_ID:');
  console.log(safe(teacherByUser));
}

console.log('\nALL_TEACHERS (id, full_name, user_id, department):');
const teachers = db.prepare('SELECT id, full_name, user_id, department FROM teachers ORDER BY full_name ASC').all();
console.log(safe(teachers));

db.close();
