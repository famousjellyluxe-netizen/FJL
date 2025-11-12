import fetch from 'node-fetch';

// Use an admin token from your database
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNDY3NTU1OC1mYWYzLTQ1YWUtYTgxMC0zZTRhYmVlMThjZDAiLCJlbWFpbCI6ImFkbWluQGZqbC5jb20iLCJyb2xlIjoib3duZXIiLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3NjI2MTU5MjgsImV4cCI6MTc2MzIyMDcyOCwiYXVkIjoiZmpsLWFkbWluIiwiaXNzIjoiZmpsLWJhY2tlbmQifQ.G5Gx38GRGlsbf0mW4grXDmvo6xiSGTrsj-af04Yml60';

console.log('Testing /api/products/admin/unannounced endpoint...\n');

try {
  const response = await fetch('http://localhost:5001/api/products/admin/unannounced', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  console.log('Status:', response.status, response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers));

  const text = await response.text();
  console.log('\nResponse Body:');
  console.log(text);

  if (text) {
    try {
      const json = JSON.parse(text);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('(Not valid JSON)');
    }
  }

} catch (error) {
  console.error('Error:', error.message);
  console.error(error);
}
