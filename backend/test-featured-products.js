import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkFeaturedStatus() {
  console.log('\n=== Checking Featured Product Status ===\n');

  // Get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, is_featured, is_active')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('All Products:');
  products.forEach(p => {
    console.log(`- ${p.name}`);
    console.log(`  ID: ${p.id}`);
    console.log(`  is_featured: ${p.is_featured}`);
    console.log(`  is_active: ${p.is_active}`);
    console.log('');
  });

  // Get featured products
  const { data: featured, error: featError } = await supabase
    .from('products')
    .select('id, name, is_featured')
    .eq('is_active', true)
    .eq('is_featured', true);

  if (featError) {
    console.error('Error:', featError);
    return;
  }

  console.log('\n=== Featured Products (is_featured = true AND is_active = true) ===');
  if (featured.length === 0) {
    console.log('No featured products found.');
  } else {
    featured.forEach(p => {
      console.log(`- ${p.name} (${p.id})`);
    });
  }

  console.log('\n');
}

checkFeaturedStatus();
