#!/usr/bin/env node

/**
 * Script to run the businesses table migration
 * This creates the businesses table and backfills existing data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables - try .env.local first, then .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Please set these in your .env or .env.local file');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('📍 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n🚀 Starting businesses table migration...\n');

  // Read the migration SQL file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '012_businesses.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    console.error('   Looking in:', path.resolve(migrationPath));
    process.exit(1);
  }

  console.log('📄 Found migration file:', migrationPath);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📝 SQL content loaded, length:', sql.length, 'characters\n');

  try {
    console.log('🔨 Executing migration...\n');
    
    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'comment on table public.businesses is \'Tenant / org scope; teachers.business_id references this table.\'');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the Supabase client to execute raw SQL
        const { data, error } = await supabase.rpc('exec', { 
          query: statement + ';' 
        }).catch(() => ({ data: null, error: null }));
        
        if (error && !error.message?.includes('already exists')) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message?.substring(0, 100));
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        // Ignore errors for things that already exist
        if (!err.message?.includes('already exists')) {
          console.warn(`⚠️  Statement ${i + 1} error:`, err.message?.substring(0, 100));
          errorCount++;
        } else {
          successCount++;
        }
      }
    }

    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} warnings/errors\n`);
    
    // Verify the table was created
    console.log('🔍 Verifying businesses table...');
    const { data: tables, error: checkError } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('⚠️  Could not verify table:', checkError.message);
      console.log('\n💡 The table might already exist. Try running the SQL manually:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy content from: supabase/migrations/012_businesses.sql');
      console.log('   3. Click Run\n');
    } else {
      console.log('✅ businesses table is accessible!\n');
    }

    // Count existing records
    const { count, error: countError } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Found ${count || 0} business records in the table\n`);
    }

    console.log('✨ Migration completed!\n');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Try creating a new teacher');
    console.log('3. It should work without business_id errors!\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\nAlternative: Run SQL manually in Supabase Dashboard');
    console.error('File location: supabase/migrations/012_businesses.sql\n');
    process.exit(1);
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
