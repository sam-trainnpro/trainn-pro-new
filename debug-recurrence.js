// Debug script to test recurrence generation
const { generateRecurringInstances } = require('./server/recurrence-utils');

// Test case for Monday at 6 PM
const baseStartTime = new Date('2025-01-20T18:00:00.000Z'); // Monday 6 PM
const baseEndTime = new Date('2025-01-20T19:00:00.000Z');   // Monday 7 PM

const rule = {
  type: 'weekly',
  interval: 1,
  daysOfWeek: [1], // Monday (1 = Monday in JS)
  endType: 'count',
  endCount: 5
};

console.log('Base start time:', baseStartTime.toISOString());
console.log('Base start time day of week:', baseStartTime.getDay()); // Should be 1 for Monday
console.log('Days of week in rule:', rule.daysOfWeek);

const instances = generateRecurringInstances(baseStartTime, baseEndTime, rule);

console.log('\nGenerated instances:');
instances.forEach((instance, index) => {
  console.log(`Instance ${index + 1}:`);
  console.log(`  Start: ${instance.startTime.toISOString()}`);
  console.log(`  Day of week: ${instance.startTime.getDay()}`);
  console.log(`  Local: ${instance.startTime.toLocaleString()}`);
});