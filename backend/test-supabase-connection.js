import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

dotenv.config({ path: envPath });

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Supabase Connection Diagnostic Test\n');
console.log('=====================================\n');

// Check environment variables
console.log('1️⃣ Checking Environment Variables:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('   SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ SET' : '❌ NOT SET');
console.log('   SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ SET' : '❌ NOT SET');
console.log('');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Missing critical environment variables!');
  process.exit(1);
}

// Test 1: Create client
console.log('2️⃣ Creating Supabase Client:');
try {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  console.log('   ✅ Supabase client created successfully');
  console.log('');

  // Test 2: Try to fetch from store_settings
  console.log('3️⃣ Testing Database Connection (store_settings table):');

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('   ❌ Query Error:', error.message);
      console.error('   Error Details:', error);
    } else {
      console.log('   ✅ Successfully connected to store_settings table');
      console.log('   ✅ Sample data:', data ? `Retrieved ${data.length} record(s)` : 'No data');
    }
  } catch (queryError) {
    console.error('   ❌ Connection Error:', queryError.message);
    console.error('   Full Error:', queryError);
  }

  console.log('');

  // Test 3: Try alternative table (products)
  console.log('4️⃣ Testing with Products Table (fallback):');

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      console.error('   ❌ Products Query Error:', error.message);
    } else {
      console.log('   ✅ Successfully connected to products table');
      console.log('   ✅ Sample data:', data ? `Retrieved ${data.length} record(s)` : 'No data');
    }
  } catch (altError) {
    console.error('   ❌ Products Connection Error:', altError.message);
  }

  console.log('');
  console.log('=====================================');
  console.log('');
  console.log('✨ Diagnostic test complete!');
  console.log('');
  console.log('If all tests passed:');
  console.log('  → Your database connection is working');
  console.log('  → You can run: npm run dev');
  console.log('');
  console.log('If tests failed:');
  console.log('  → Check SUPABASE_URL and SUPABASE_KEY in .env');
  console.log('  → Verify they match your Supabase project');
  console.log('  → Check your internet connection');
  console.log('  → Check firewall/VPN settings');
  console.log('');

} catch (clientError) {
  console.error('❌ Failed to create Supabase client:', clientError.message);
  console.error('Full Error:', clientError);
}
