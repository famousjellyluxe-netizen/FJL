// Update admin password
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://kgkjbardkywvdjwseafe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtna2piYXJka3l3dmRqd3NlYWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDIyMTAsImV4cCI6MjA3ODE3ODIxMH0.KwhpW8k3NMY0JbHk34sDb_3MTXv-0s-bmcDXX2SKnmw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAdminPassword() {
  try {
    console.log('📝 Updating admin password...');

    // Hash password
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Update admin password
    const { data, error } = await supabase
      .from('admins')
      .update({ password_hash: passwordHash, updated_at: new Date() })
      .eq('email', 'admin@fjl.com')
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating password:', error);
    } else {
      console.log('✅ Admin password updated successfully!');
      console.log('Email:', data.email);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAdminPassword();
