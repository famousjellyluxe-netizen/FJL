import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', url);
console.log('Key:', key ? 'SET' : 'NOT SET');

const client = createClient(url, key);

try {
  const result = await client.from('store_settings').select('*').limit(1);
  console.log('✅ Connection successful');
  console.log('Result:', result);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Full error:', error);
}
