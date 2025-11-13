// Create admin account in Supabase
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://kgkjbardkywvdjwseafe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtna2piYXJka3l3dmRqd3NlYWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDIyMTAsImV4cCI6MjA3ODE3ODIxMH0.KwhpW8k3NMY0JbHk34sDb_3MTXv-0s-bmcDXX2SKnmw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  try {
    console.log('📝 Creating admin account...');

    // Hash password
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', 'admin@fjl.com')
      .single();

    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      return;
    }

    // Create admin account
    const { data, error } = await supabase
      .from('admins')
      .insert([
        {
          email: 'admin@fjl.com',
          password_hash: passwordHash,
          name: 'Admin User',
          role: 'admin',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin:', error);
    } else {
      console.log('✅ Admin account created successfully!');
      console.log('Email:', data.email);
      console.log('Role:', data.role);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();
