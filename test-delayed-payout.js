// Test script to demonstrate the delayed payout calculation

console.log('=== Delayed Payout System Test ===');

// Simulate the new fee calculation
function calculateDelayedPayout(classPrice) {
  const amountInCents = Math.round(classPrice * 100);
  
  // Calculate Stripe fees: 2.9% + $0.30 per transaction
  const stripeFee = Math.round(amountInCents * 0.029) + 30;
  
  // Calculate net amount after Stripe fees
  const netAmount = amountInCents - stripeFee;
  
  // Split net amount: 85% to coach, 15% to platform
  const coachPayout = Math.round(netAmount * 0.85);
  const platformFee = netAmount - coachPayout;
  
  return {
    originalAmount: classPrice,
    stripeFee: stripeFee / 100,
    netAmount: netAmount / 100,
    coachPayout: coachPayout / 100,
    platformFee: platformFee / 100,
    payoutDelay: '2 days after class completion'
  };
}

console.log('\n📊 Example Delayed Payout Schedule:');
console.log('=====================================');

[25, 50, 75, 100].forEach(price => {
  const result = calculateDelayedPayout(price);
  console.log(`\n💰 Class Price: $${result.originalAmount}`);
  console.log(`   Stripe Fee: $${result.stripeFee.toFixed(2)}`);
  console.log(`   Net Amount: $${result.netAmount.toFixed(2)}`);
  console.log(`   Coach Gets: $${result.coachPayout.toFixed(2)} (${result.payoutDelay})`);
  console.log(`   Platform:   $${result.platformFee.toFixed(2)}`);
});

console.log('\n⏰ Payout Schedule:');
console.log('===================');
console.log('• Customer pays immediately during booking');
console.log('• Funds are held by Stripe (not transferred to coach)');
console.log('• 2 days after class completion → Coach receives payout');
console.log('• Automated processing every 10 minutes (dev) / 4 hours (prod)');
console.log('• Platform retains 15% of net amount after Stripe fees');