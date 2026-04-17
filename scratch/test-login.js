const { validateLogin } = require('./lib/auth');

async function test() {
  const email = 'binjoharf@gmail.com';
  const password = 'admin123';
  
  console.log(`Testing login for ${email}...`);
  try {
    const isValid = await validateLogin(email, password);
    console.log('Login result:', isValid);
  } catch (e) {
    console.error('Login test failed with error:', e);
  }
}

test();
