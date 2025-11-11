import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationFile) {
  console.log(`\n📋 Running migration: ${migrationFile}\n`);

  const migrationPath = path.join(__dirname, 'migrations', migrationFile);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`[${i + 1}/${statements.length}] Executing...`);
    console.log(statement.substring(0, 80) + '...\n');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct execution if rpc doesn't work
        console.log('⚠️  RPC method not available, trying direct query...');
        // Note: Supabase client doesn't support raw SQL directly
        // User will need to run migration manually in SQL Editor
        console.log('⚠️  Please run this migration manually in Supabase SQL Editor:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to SQL Editor');
        console.log('   4. Paste the migration SQL');
        console.log('   5. Click "Run"\n');
        process.exit(1);
      }

      console.log('✅ Success\n');
    } catch (error) {
      console.error(`❌ Error:`, error.message);
      console.log('\n⚠️  Please run migration manually in Supabase SQL Editor\n');
      process.exit(1);
    }
  }

  console.log('✅ Migration completed successfully!\n');
}

// Run the migration
runMigration('add_product_announcement_tracking.sql').catch(console.error);
