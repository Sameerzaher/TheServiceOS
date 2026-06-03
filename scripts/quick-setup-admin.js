// ========================================
// Quick Fix: Create First Admin & Test Login
// ========================================
// Copy this entire script and run in browser Console (F12)
// at: http://localhost:3000/login

console.log('🚀 Starting admin creation and login test...\n');

async function setupAndTest() {
  try {
    // Step 1: Check if any teachers exist
    console.log('📋 Step 1: Checking existing teachers...');
    const teachersRes = await fetch('/api/teachers', { method: 'GET' });
    const teachersData = await teachersRes.json();
    
    if (!teachersRes.ok) {
      console.error('❌ Failed to fetch teachers:', teachersData);
      return;
    }
    
    console.log(`Found ${teachersData.teachers?.length || 0} teachers in database`);
    
    // Display existing teachers
    if (teachersData.teachers && teachersData.teachers.length > 0) {
      console.log('\n👥 Existing teachers:');
      teachersData.teachers.forEach(t => {
        const roleIcon = t.role === 'admin' ? '👑' : '👤';
        const passwordIcon = t.hasPassword ? '🔒' : '❌';
        console.log(`  ${roleIcon} ${t.email} | ${t.businessName} | ${passwordIcon}`);
      });
      
      // Check if admin exists
      const hasAdmin = teachersData.teachers.some(t => t.role === 'admin' && t.hasPassword);
      
      if (hasAdmin) {
        console.log('\n✅ Admin already exists! You can login now.');
        return;
      } else {
        console.log('\n⚠️ No valid admin found. Creating one...');
      }
    } else {
      console.log('\n⚠️ No teachers found. Creating first admin...');
    }
    
    // Step 2: Create admin
    console.log('\n📝 Step 2: Creating admin user...');
    const createRes = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'Admin123!',
        fullName: 'Admin User',
        businessName: 'My Business',
        phone: '0501234567',
        slug: 'admin-business',
        businessType: 'driving_instructor',
        role: 'admin'
      })
    });
    
    const createData = await createRes.json();
    
    if (!createRes.ok || !createData.ok) {
      console.error('❌ Failed to create admin:', createData.error);
      
      // If email exists, that's OK - we can try to login
      if (createData.error?.includes('כבר קיים')) {
        console.log('ℹ️ Admin already exists, will try to login...');
      } else {
        return;
      }
    } else {
      console.log('✅ Admin created successfully!');
      console.log('   ID:', createData.teacher.id);
      console.log('   Email:', createData.teacher.email);
      console.log('   Role:', createData.teacher.role);
    }
    
    // Step 3: Test login
    console.log('\n🔐 Step 3: Testing login...');
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'Admin123!'
      })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginRes.ok || !loginData.ok) {
      console.error('❌ Login failed:', loginData.error);
      console.log('\n🔍 Debugging info:');
      console.log('If you see "אישורים שגויים", check:');
      console.log('1. Run in Supabase SQL Editor:');
      console.log('   SELECT email, password_hash IS NOT NULL as has_password FROM teachers;');
      console.log('2. If password_hash is NULL, admin was created without password');
      console.log('3. Try deleting and recreating with the script above');
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('   Teacher:', loginData.data.teacher.email);
    console.log('   Role:', loginData.data.teacher.role);
    console.log('   Business:', loginData.data.teacher.businessName);
    
    // Step 4: Verify session
    console.log('\n🔍 Step 4: Verifying session...');
    const meRes = await fetch('/api/auth/me');
    const meData = await meRes.json();
    
    if (!meRes.ok || !meData.ok) {
      console.error('❌ Session verification failed:', meData.error);
      return;
    }
    
    console.log('✅ Session is valid!');
    console.log('   Authenticated as:', meData.data.teacher.email);
    
    console.log('\n\n🎉 SUCCESS! Everything is working!');
    console.log('\n📝 Next steps:');
    console.log('1. Refresh the page - you should be redirected to /dashboard');
    console.log('2. If you\'re already at /login, just click the login button');
    console.log('\nCredentials:');
    console.log('Email: admin@test.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

setupAndTest();
