// Send test email through server endpoint
const http = require('http');

const testEmailData = {
  customerEmail: "kseniya.kapytouskaya+5c@gmail.com",
  customerName: "Kseniya Test",
  className: "Morning Yoga Flow (Test)",
  classDate: "Saturday, August 2, 2025",
  classTime: "8:00 AM PT",
  location: "Golden Gate Park, San Francisco, CA",
  coachName: "Sarah Johnson",
  totalPaid: "$10.00",
  isDiscounted: true
};

const postData = JSON.stringify({
  action: 'send_test_confirmation',
  data: testEmailData
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/test/send-confirmation-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Sending test confirmation email request to server...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Test email request sent successfully');
      console.log('Response:', data);
    } else {
      console.log('❌ Error response:', res.statusCode, data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(postData);
req.end();