#!/usr/bin/env node

/**
 * Run auth_tokens migration
 * הרצת מיגרציה לטוקנים
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function runMigration() {
  console.log('\n🚀 Running auth_tokens migration...\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '013_auth_tokens.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Migration file loaded\n');

  try {
    // Note: Supabase client doesn't have direct SQL execution
    // You need to run this in Supabase Dashboard SQL Editor
    console.log('📋 Copy and paste this SQL in Supabase Dashboard > SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n✨ Steps:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in the left menu');
    console.log('4. Click "New Query"');
    console.log('5. Copy the SQL above');
    console.log('6. Paste and click "Run"');
    console.log('\nOr run it directly from migration file:\n');
    console.log(`   File: ${migrationPath}\n`);

    // Alternative: Check if auth_tokens table exists
    console.log('🔍 Checking if auth_tokens table exists...\n');
    
    const { data, error } = await supabase
      .from('auth_tokens')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('⚠️  auth_tokens table does not exist yet');
        console.log('   Please run the migration in Supabase Dashboard\n');
      } else {
        console.error('❌ Error checking table:', error.message);
      }
    } else {
      console.log('✅ auth_tokens table already exists!');
      console.log('   Migration appears to be complete\n');
      
      // Check email_verified column
      const { data: teachers, error: teacherError } = await supabase
        .from('teachers')
        .select('email_verified')
        .limit(1);
      
      if (!teacherError) {
        console.log('✅ email_verified column exists in teachers table\n');
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
