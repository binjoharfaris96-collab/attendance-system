const { getUserByEmail } = require('./lib/db');
const { validateLogin } = require('./lib/auth');

async function diag() {
  const email = 'binjoharf@gmail.com';
  const password = 'admin123';

  console.log('--- START DIAGNOSTIC ---');
  try {
    const user = await getUserByEmail(email);
    console.log('User in DB:', user ? 'FOUND' : 'NOT FOUND');
    if (user) {
      console.log('User Detail:', {
        email: user.email,
        role: user.role,
        hasHash: !!user.passwordHash
      });
      
      const isValid = await validateLogin(email, password);
      console.log('Validation Result:', isValid);
    }
  } catch (e) {
    console.error('Diagnostic error:', e);
  }
  console.log('--- END DIAGNOSTIC ---');
}

diag();
