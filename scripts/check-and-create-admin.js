/**
 * Check if admin teacher exists and create if needed
 * 
 * HOW TO USE:
 * 1. Open http://localhost:3000 in your browser
 * 2. Open Developer Console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 */

console.log('🔍 Checking for admin teacher...\n');

// Step 1: Check if admin exists
fetch('/api/teachers')
  .then(r => r.json())
  .then(result => {
    console.log('📋 Current teachers:', result);
    
    if (result.ok && result.teachers && result.teachers.length > 0) {
      console.log('✅ Found', result.teachers.length, 'teacher(s) in the system');
      console.log('\n🔐 Login credentials:');
      result.teachers.forEach(t => {
        console.log(`  - Email: ${t.email || 'N/A'}`);
        console.log(`  - Name: ${t.fullName}`);
        console.log(`  - Role: ${t.role || 'N/A'}`);
        console.log(`  - Has password: ${t.hasPassword ? 'YES ✅' : 'NO ⚠️ PROBLEM!'}`);
        console.log(`  - Active: ${t.isActive ? 'YES' : 'NO (disabled)'}`);
        console.log('');
      });
      });
      
      console.log('\n📍 Next steps:');
      console.log('1. Go to /login');
      console.log('2. Use the email and password you set when creating the teacher');
      console.log('\n⚠️ If you forgot the password or teacher has no password, you need to:');
      console.log('   - Delete the teacher from Supabase Dashboard');
      console.log('   - Run the create-admin script again');
      return;
    }
    
    console.log('⚠️ No teachers found. Creating first admin teacher...\n');
    
    // Step 2: Create admin teacher
    return fetch('/api/auth/signup', {
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
    .then(signupResult => {
      console.log('📝 Signup result:', signupResult);
      
      if (signupResult.ok) {
        console.log('\n✅ SUCCESS! Admin teacher created!\n');
        console.log('🔐 Login credentials:');
        console.log('   📧 Email: admin@test.com');
        console.log('   🔑 Password: Admin123!');
        console.log('   👤 Role: admin');
        console.log('\n📍 Next steps:');
        console.log('1. Go to /login');
        console.log('2. Enter the credentials above');
        console.log('3. You will be redirected to /dashboard');
        console.log('4. You can add more teachers from /teachers page');
      } else {
        console.error('\n❌ ERROR creating admin teacher:', signupResult.error);
        console.log('\n🔧 Possible solutions:');
        console.log('1. Check that migration 011_teacher_auth_clean.sql ran successfully');
        console.log('2. Check Supabase Dashboard → SQL Editor');
        console.log('3. Make sure .env.local has correct SUPABASE credentials');
      }
    });
  })
  .catch(err => {
    console.error('❌ Script error:', err);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure dev server is running (npm run dev)');
    console.log('2. Check Network tab for failed requests');
    console.log('3. Check that you are on http://localhost:3000');
  });
