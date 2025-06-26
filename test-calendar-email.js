// Test script to send calendar invite email
import { sendBookingConfirmation } from './server/email.ts';

async function sendTestEmail() {
  console.log('Sending test booking confirmation email with calendar invite...');
  
  // Mock booking data for testing
  const testData = {
    booking: {
      id: 999,
      quantity: 1,
      totalAmount: 45.00
    },
    classData: {
      id: 999,
      title: "HIIT Bootcamp Test Class",
      description: "High-intensity interval training session focusing on cardio and strength building. Perfect for all fitness levels!",
      startTime: new Date('2025-06-27T18:00:00Z'), // Tomorrow at 6 PM
      endTime: new Date('2025-06-27T19:00:00Z'),   // Until 7 PM
      price: 45.00,
      address: "Central Park, New York, NY 10024",
      location: "Central Park - Sheep Meadow",
      whatToBring: "Water bottle, yoga mat, towel"
    },
    customer: {
      id: 999,
      firstName: "Sam",
      lastName: "Roth",
      email: "sam@trainn.pro"
    },
    coach: {
      id: 999,
      firstName: "Alex",
      lastName: "Johnson",
      email: "alex.coach@trainn.pro"
    }
  };

  try {
    const success = await sendBookingConfirmation(testData);
    if (success) {
      console.log('✅ Test email sent successfully to sam@trainn.pro');
      console.log('Check your inbox for the booking confirmation with calendar invite button!');
    } else {
      console.log('❌ Failed to send test email');
    }
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

sendTestEmail();