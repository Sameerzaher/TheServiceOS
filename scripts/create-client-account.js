#!/usr/bin/env node

/**
 * Create a client account with email and password
 * יצירת חשבון לקוח עם אימייל וסיסמה
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Hash password using PBKDF2 (same as the app)
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

async function createClientAccount() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('📝 שימוש:');
    console.log('  node scripts/create-client-account.js <phone> <email> <password>');
    console.log('');
    console.log('דוגמה:');
    console.log('  node scripts/create-client-account.js +972501234567 client@example.com Pass123');
    console.log('');
    process.exit(1);
  }

  const [phone, email, password] = args;

  console.log('\n🔧 יוצר חשבון לקוח...\n');

  try {
    // Find client by phone
    const { data: client, error: findError } = await supabase
      .from('clients')
      .select('id, full_name, phone, email')
      .eq('phone', phone)
      .single();

    if (findError || !client) {
      console.error('❌ לקוח לא נמצא עם מספר:', phone);
      console.log('💡 וודא שהלקוח קיים בטבלת clients');
      process.exit(1);
    }

    console.log('✅ לקוח נמצא:', client.full_name);

    // Hash password
    const passwordHash = hashPassword(password);

    // Update client with email and password
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        email_verified: true, // For testing
        portal_enabled: true,
      })
      .eq('id', client.id);

    if (updateError) {
      console.error('❌ שגיאה בעדכון:', updateError.message);
      process.exit(1);
    }

    console.log('\n✅ החשבון נוצר בהצלחה!\n');
    console.log('📝 פרטי התחברות:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
    console.log('🌐 כתובת הפורטל:');
    console.log('   http://localhost:3000/client-login');
    console.log('');

  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    process.exit(1);
  }
}

createClientAccount();
