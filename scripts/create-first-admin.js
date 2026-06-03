/**
 * Quick script to create first admin teacher via API
 * 
 * 1. Open browser console on http://localhost:3000
 * 2. Run this script
 * 3. Login with the credentials
 */

// Create first admin teacher
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'Admin123!',
    fullName: 'Admin Teacher',
    businessName: 'My Business',
    phone: '050-0000000',
    slug: 'admin-teacher',
    businessType: 'driving_instructor',
    role: 'admin'
  })
})
  .then(r => r.json())
  .then(result => {
    console.log('Signup result:', result);
    if (result.ok) {
      console.log('✅ Admin teacher created!');
      console.log('📧 Email: admin@test.com');
      console.log('🔑 Password: Admin123!');
      console.log('🔗 Login at: /login');
      console.log('\nNow you can:');
      console.log('1. Go to /login');
      console.log('2. Login with the credentials above');
      console.log('3. Add more teachers from /teachers');
    } else {
      console.error('❌ Error:', result.error);
    }
  })
  .catch(err => console.error('Script error:', err));
