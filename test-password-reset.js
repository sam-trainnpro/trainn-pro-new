import { sendPasswordResetEmail } from './server/email.js';

async function testPasswordReset() {
  console.log('Testing password reset email functionality...');
  
  try {
    const result = await sendPasswordResetEmail(
      'test@example.com',
      'test-reset-token-123',
      'Test User'
    );
    
    if (result) {
      console.log('✅ Password reset email sent successfully');
    } else {
      console.log('❌ Failed to send password reset email');
    }
  } catch (error) {
    console.error('❌ Error testing password reset email:', error);
  }
}

testPasswordReset();