// Test script to verify email confirmation functionality
const { sendBookingConfirmation } = require('./server/email.ts');

// Mock booking data for testing
const testBookingData = {
  booking: {
    id: 999,
    userId: 3,
    classId: 176,
    quantity: 1,
    status: "confirmed",
    stripePaymentIntentId: "test_pi_123456",
    paymentDate: new Date(),
    paymentMethod: "stripe"
  },
  classData: {
    id: 176,
    title: "Test Strength Training",
    description: "A test class for email verification",
    price: 25.00,
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 3600000), // Tomorrow + 1 hour
    location: "Test Gym Location",
    whatToBring: "Water bottle and towel",
    coachId: 1
  },
  customer: {
    id: 3,
    email: "samgroth+cust1@gmail.com",
    firstName: "Sam",
    lastName: "Customer"
  },
  coach: {
    id: 1,
    firstName: "John",
    lastName: "Coach",
    email: "samgroth+coach1@gmail.com"
  }
};

async function testEmail() {
  try {
    console.log('Testing email confirmation...');
    const result = await sendBookingConfirmation(testBookingData);
    console.log('Email test result:', result);
  } catch (error) {
    console.error('Email test error:', error);
  }
}

// Run the test
testEmail();