import { createClient } from '@supabase/supabase-js';

let supabase = null;
let supabaseService = null;
let initialized = false;

// Lazy initialization - called from index.js after dotenv loads
export function initializeDatabase() {
  if (initialized) return;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase environment variables not configured');
    console.warn('  SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.warn('  SUPABASE_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
    console.warn('  API will run in offline/test mode - database calls will fail gracefully');
  } else {
    // Client for user operations
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Service client for admin operations (with elevated privileges)
    supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase client initialized successfully');
  }

  initialized = true;
}

export function getSupabase() {
  if (!initialized) {
    initializeDatabase();
  }
  return supabase;
}

export function getSupabaseService() {
  if (!initialized) {
    initializeDatabase();
  }
  return supabaseService;
}

// Export both for compatibility
export { supabase, supabaseService };

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  if (!supabase) {
    console.warn('⚠️  Database not configured - skipping connection test');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('store_name')
      .limit(1);

    if (error) {
      console.error('⚠️  Database connection error:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('⚠️  Database connection failed:', err.message);
    // Don't block startup - API is still useful for testing
    return false;
  }
}

export default { supabase, supabaseService };
