import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdmin() {
  try {
    const email = 'admin@fjl.com';
    const password = 'fjlclothing123';
    
    // First, try to delete existing admin
    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('email', email.toLowerCase());
    
    if (deleteError) {
      console.log('No existing admin to delete or deletion failed:', deleteError.message);
    } else {
      console.log('Deleted existing admin');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new admin
    const { data, error } = await supabase
      .from('admins')
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          full_name: 'Admin User',
          role: 'owner',
          is_active: true
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating admin:', error.message);
    } else {
      console.log('✅ Admin reset successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role: owner');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

resetAdmin();
