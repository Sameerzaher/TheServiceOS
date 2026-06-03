/**
 * Test login directly from console
 * 
 * HOW TO USE:
 * 1. Open http://localhost:3000 in your browser
 * 2. Open Developer Console (F12)
 * 3. Copy and paste this script
 * 4. Change the email/password if needed
 * 5. Press Enter
 */

const TEST_EMAIL = 'admin@test.com';
const TEST_PASSWORD = 'Admin123!';

console.log('🔐 Testing login...\n');
console.log(`📧 Email: ${TEST_EMAIL}`);
console.log(`🔑 Password: ${TEST_PASSWORD}\n`);

fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })
})
.then(async response => {
  const data = await response.json();
  
  console.log('📊 Response status:', response.status);
  console.log('📦 Response data:', data);
  
  if (response.ok && data.ok) {
    console.log('\n✅ LOGIN SUCCESS!');
    console.log('👤 Teacher:', data.data.teacher.fullName);
    console.log('📧 Email:', data.data.teacher.email);
    console.log('🎭 Role:', data.data.teacher.role);
    console.log('🔗 Token:', data.data.token.substring(0, 20) + '...');
    console.log('\n📍 Cookie should be set. Check:');
    console.log('   Application → Cookies → session_token');
    console.log('\n🚀 Now try going to /dashboard');
  } else {
    console.error('\n❌ LOGIN FAILED!');
    console.error('Error:', data.error);
    
    console.log('\n🔧 Common issues:');
    if (data.error.includes('שגויים')) {
      console.log('   - Wrong email or password');
      console.log('   - Teacher does not exist');
      console.log('   - Run check-and-create-admin.js first');
    } else if (data.error.includes('אינו פעיל')) {
      console.log('   - Teacher account is disabled (is_active = false)');
      console.log('   - Check Supabase Dashboard');
    } else if (data.error.includes('הגדיר סיסמה')) {
      console.log('   - Teacher has no password set');
      console.log('   - Delete and recreate with signup API');
    } else {
      console.log('   - Check server logs');
      console.log('   - Check Supabase connection');
    }
  }
})
.catch(err => {
  console.error('❌ Network error:', err);
  console.log('\n🔧 Check:');
  console.log('   - Dev server is running');
  console.log('   - You are on http://localhost:3000');
  console.log('   - Network tab for failed request');
});
