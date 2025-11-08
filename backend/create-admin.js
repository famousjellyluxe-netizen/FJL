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

async function createAdmin() {
  try {
    const email = 'admin@fjl.com';
    const password = 'Admin@123456';
    const fullName = 'Admin User';
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create admin
    const { data, error } = await supabase
      .from('admins')
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          full_name: fullName,
          role: 'owner',
          is_active: true
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating admin:', error.message);
    } else {
      console.log('✅ Admin created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role: owner');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createAdmin();
