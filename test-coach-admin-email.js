const { sendNewCoachNotificationToAdmin } = require('./server/email');

// Test coach data
const testCoach = {
  id: 999,
  firstName: 'John',
  lastName: 'Doe',
  email: 'test.coach@example.com',
  phone: '555-123-4567',
  role: 'coach',
  areasOfExpertise: 'HIIT, Strength Training, Yoga',
  bio: 'Certified personal trainer with 5 years of experience helping clients achieve their fitness goals.',
  createdAt: new Date(),
  isApproved: false
};

async function testAdminEmail() {
  console.log('Testing admin notification email for new coach registration...');
  
  try {
    const result = await sendNewCoachNotificationToAdmin(testCoach);
    if (result) {
      console.log('✅ Admin notification email sent successfully!');
      console.log('Email sent to: sam@trainn.pro');
      console.log('Subject: New Coach Registration - Approval Required');
    } else {
      console.log('❌ Failed to send admin notification email');
    }
  } catch (error) {
    console.error('❌ Error testing admin email:', error);
  }
}

testAdminEmail();