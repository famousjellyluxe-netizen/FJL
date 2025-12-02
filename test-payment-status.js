// Test script to check the payment-status endpoint
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNDY3NTU1OC1mYWYzLTQ1YWUtYTgxMC0zZTRhYmVlMThjZDAiLCJlbWFpbCI6ImFkbWluQGZqbC5jb20iLCJyb2xlIjoib3duZXIiLCJ0eXBlIjoiYWRtaW4iLCJpYXQiOjE3NjI2MTU5MjgsImV4cCI6MTc2MzIyMDcyOCwiYXVkIjoiZmpsLWFkbWluIiwiaXNzIjoiZmpsLWJhY2tlbmQifQ.G5Gx38GRGlsbf0mW4grXDmvo6xiSGTrsj-af04Yml60";
const ORDER_ID = "91e6b1cd-be2f-4e25-b9c4-6821677691fe"; // Use a real order ID

async function testPaymentStatus() {
  try {
    console.log('Testing payment-status endpoint...');
    
    const response = await fetch(`http://localhost:5001/api/orders/${ORDER_ID}/payment-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ payment_status: 'verified' })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    console.log('Response headers:', response.headers.get('content-type'));

    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Error response text:', text);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testPaymentStatus();
