// Test script to check image upload functionality
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImageUpload() {
  try {
    console.log('Testing image upload...');
    
    // Create a simple test image file
    const testImagePath = 'uploads/image-1748464729166-619325960.jpeg';
    if (!fs.existsSync(testImagePath)) {
      console.log('Test image file not found');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    const response = await fetch('http://localhost:5000/api/upload-image', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'connect.sid=test-session' // Mock session for testing
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const result = await response.json();
      console.log('Upload successful:', result);
    } else {
      const error = await response.text();
      console.log('Upload failed:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageUpload();