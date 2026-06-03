#!/usr/bin/env node

/**
 * User Management Script
 * סקריפט לניהול משתמשים - צפייה, עדכון סיסמה, יצירת admin
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Hash password (same logic as the app - PBKDF2 with salt)
 */
function hashPassword(password) {
  const SALT_LENGTH = 32;
  const ITERATIONS = 100000;
  const KEY_LENGTH = 64;
  const DIGEST = 'sha512';
  
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  ).toString('hex');
  
  return `${salt}:${hash}`;
}

/**
 * List all teachers in the database
 */
async function listTeachers() {
  console.log('\n📋 רשימת משתמשים במערכת:\n');
  
  const { data, error } = await supabase
    .from('teachers')
    .select('id, email, full_name, role, business_name, slug, is_active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ שגיאה:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  אין משתמשים במערכת\n');
    return;
  }
  
  data.forEach((teacher, index) => {
    console.log(`${index + 1}. ${teacher.full_name || 'ללא שם'}`);
    console.log(`   📧 Email: ${teacher.email}`);
    console.log(`   👤 Role: ${teacher.role}`);
    console.log(`   🏢 Business: ${teacher.business_name || 'N/A'}`);
    console.log(`   🔗 Slug: ${teacher.slug}`);
    console.log(`   ✅ Active: ${teacher.is_active ? 'כן' : 'לא'}`);
    console.log(`   🆔 ID: ${teacher.id}`);
    console.log('');
  });
}

/**
 * Update password for a user
 */
async function updatePassword(email, newPassword) {
  console.log(`\n🔐 מעדכן סיסמה עבור: ${email}\n`);
  
  // Check if user exists
  const { data: teacher, error: findError } = await supabase
    .from('teachers')
    .select('id, email, full_name')
    .eq('email', email)
    .single();
  
  if (findError || !teacher) {
    console.error('❌ משתמש לא נמצא:', email);
    return;
  }
  
  const passwordHash = hashPassword(newPassword);
  
  const { error: updateError } = await supabase
    .from('teachers')
    .update({ password_hash: passwordHash })
    .eq('email', email);
  
  if (updateError) {
    console.error('❌ שגיאה בעדכון סיסמה:', updateError.message);
    return;
  }
  
  console.log('✅ הסיסמה עודכנה בהצלחה!');
  console.log(`\n📝 פרטי התחברות:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${newPassword}`);
  console.log('');
}

/**
 * Create a new admin user
 */
async function createAdmin(email, password, fullName, businessName, businessType = 'driving_instructor') {
  console.log(`\n👤 יוצר משתמש admin חדש: ${email}\n`);
  
  // Check if email already exists
  const { data: existing } = await supabase
    .from('teachers')
    .select('email')
    .eq('email', email)
    .single();
  
  if (existing) {
    console.error('❌ משתמש עם אימייל זה כבר קיים');
    console.log('💡 השתמש באפשרות update-password לעדכון הסיסמה\n');
    return;
  }
  
  const teacherId = crypto.randomUUID();
  const businessId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();
  
  // Create business first
  const { error: businessError } = await supabase
    .from('businesses')
    .insert({
      id: businessId,
      name: businessName || `${fullName} Business`,
      created_at: now,
    });
  
  if (businessError) {
    console.error('❌ שגיאה ביצירת business:', businessError.message);
    return;
  }
  
  // Create teacher
  const { error: teacherError } = await supabase
    .from('teachers')
    .insert({
      id: teacherId,
      business_id: businessId,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      business_name: businessName || `${fullName} Business`,
      phone: '',
      slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
      business_type: businessType, // Valid types: 'driving_instructor' or 'cosmetic_clinic'
      role: 'admin',
      is_active: true,
      created_at: now,
    });
  
  if (teacherError) {
    console.error('❌ שגיאה ביצירת משתמש:', teacherError.message);
    return;
  }
  
  console.log('✅ משתמש Admin נוצר בהצלחה!');
  console.log(`\n📝 פרטי התחברות:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: admin`);
  console.log('');
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔧 ServiceOS - ניהול משתמשים\n');
  
  switch (command) {
    case 'list':
      await listTeachers();
      break;
    
    case 'update-password': {
      const email = args[1];
      const password = args[2];
      
      if (!email || !password) {
        console.error('❌ שימוש: node scripts/manage-user.js update-password <email> <new-password>');
        process.exit(1);
      }
      
      await updatePassword(email, password);
      break;
    }
    
    case 'create-admin': {
      const email = args[1];
      const password = args[2];
      const fullName = args[3] || 'Admin User';
      const businessName = args[4] || 'My Business';
      const businessType = args[5] || 'driving_instructor'; // driving_instructor or cosmetic_clinic
      
      if (!email || !password) {
        console.error('❌ שימוש: node scripts/manage-user.js create-admin <email> <password> [fullName] [businessName] [businessType]');
        console.error('   סוגי עסק: driving_instructor (ברירת מחדל) או cosmetic_clinic');
        process.exit(1);
      }
      
      await createAdmin(email, password, fullName, businessName, businessType);
      break;
    }
    
    default:
      console.log('📖 שימוש:\n');
      console.log('  node scripts/manage-user.js list');
      console.log('    צפה בכל המשתמשים במערכת\n');
      console.log('  node scripts/manage-user.js update-password <email> <new-password>');
      console.log('    עדכן סיסמה למשתמש קיים\n');
      console.log('  node scripts/manage-user.js create-admin <email> <password> [fullName] [businessName] [businessType]');
      console.log('    צור משתמש admin חדש');
      console.log('    businessType: driving_instructor (ברירת מחדל) או cosmetic_clinic\n');
      console.log('דוגמאות:');
      console.log('  node scripts/manage-user.js list');
      console.log('  node scripts/manage-user.js update-password sameerzaher@gmail.com 123456');
      console.log('  node scripts/manage-user.js create-admin admin@example.com admin123 "Admin User" "My Business"');
      console.log('  node scripts/manage-user.js create-admin admin@example.com admin123 "Admin User" "Beauty Clinic" cosmetic_clinic');
      console.log('');
      break;
  }
}

main().catch(err => {
  console.error('❌ שגיאה:', err.message);
  process.exit(1);
});
