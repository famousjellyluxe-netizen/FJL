import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Client for user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client for admin operations (with elevated privileges)
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('store_name')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return false;
    }

    console.log('✓ Database connection successful');
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}

export default { supabase, supabaseService };
