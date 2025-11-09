/**
 * Simple script to set up admin account
 * Run with: node setup-admin-account.js
 */

import bcrypt from 'bcryptjs';
import { supabase } from './backend/src/config/database.js';

const ADMIN_EMAIL = 'admin@fjl.com';
const ADMIN_PASSWORD = 'admin123';

async function setupAdmin() {
  try {
    console.log('Setting up admin account...\n');

    // Hash the password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log('✅ Password hashed');

    // Insert or update admin
    const { data, error } = await supabase
      .from('admins')
      .upsert([
        {
          email: ADMIN_EMAIL,
          full_name: 'Admin User',
          password_hash: passwordHash,
          role: 'owner',
          is_active: true
        }
      ],
      {
        onConflict: 'email'
      })
      .select();

    if (error) {
      console.error('❌ Error setting up admin:', error);
      return;
    }

    console.log('✅ Admin account created/updated');
    console.log('\nAdmin Details:');
    console.log('  Email:', ADMIN_EMAIL);
    console.log('  Password:', ADMIN_PASSWORD);
    console.log('  Role: owner');
    console.log('  Status: Active');
    console.log('\n✅ You can now login to the admin panel!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAdmin();
