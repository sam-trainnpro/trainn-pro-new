const { DatabaseStorage } = require('./server/storage.js');
const storage = new DatabaseStorage();

async function testReferralCompletion() {
  try {
    console.log('=== TESTING REFERRAL COMPLETION FOR BOOKING 213 ===');
    console.log('User 170 (Ks12) just completed their first paid class');
    console.log('Referred by User 169 (Jan Roth - Coach)');
    console.log('Expected: $5 Stripe transfer to coach + $5 credit to customer');
    console.log('');
    
    // Process referral completion for user 170
    await storage.processReferralCompletion(170);
    
    console.log('✅ Referral completion processing finished');
    console.log('Check scheduled_payouts table for new customer_referral_reward payout');
    
  } catch (error) {
    console.error('❌ Error processing referral completion:', error);
  } finally {
    process.exit(0);
  }
}

testReferralCompletion();