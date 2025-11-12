const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNDY3NTU1OC1mYWYzLTQ1YWUtYTgxMC0zZTRhYmVlMThjZDAiLCJlbWFpbCI6ImFkbWluQGZqbC5jb20iLCJyb2xlIjoib3duZXIiLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3NjI2MTU5MjgsImV4cCI6MTc2MzIyMDcyOCwiYXVkIjoiZmpsLWFkbWluIiwiaXNzIjoiZmpsLWJhY2tlbmQifQ.G5Gx38GRGlsbf0mW4grXDmvo6xiSGTrsj-af04Yml60";
const PRODUCT_ID = "92d8f16c-6d47-4e3b-9523-20d0610b6a11";

async function testUpdateFeatured() {
  console.log('\n=== Testing Update Product with is_featured ===\n');

  // First, get current product state
  const getResponse = await fetch(`http://localhost:5001/api/products/${PRODUCT_ID}`);
  const currentProduct = await getResponse.json();
  console.log('Current product:');
  console.log('  is_featured:', currentProduct.data.is_featured);
  console.log('');

  // Update with is_featured = true
  const updateData = {
    name: currentProduct.data.name,
    description: currentProduct.data.description,
    price: currentProduct.data.price,
    is_featured: true
  };

  console.log('Sending PUT request with:');
  console.log(JSON.stringify(updateData, null, 2));
  console.log('');

  const putResponse = await fetch(`http://localhost:5001/api/products/${PRODUCT_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    body: JSON.stringify(updateData)
  });

  const updateResult = await putResponse.json();
  console.log('PUT Response:');
  console.log(JSON.stringify(updateResult, null, 2));
  console.log('');

  // Fetch again to verify
  const verifyResponse = await fetch(`http://localhost:5001/api/products/${PRODUCT_ID}`);
  const verifyProduct = await verifyResponse.json();
  console.log('After update:');
  console.log('  is_featured:', verifyProduct.data.is_featured);
  console.log('');
}

testUpdateFeatured();
