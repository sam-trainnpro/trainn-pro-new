import { addDays, addWeeks, addMonths, format, isAfter } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endType: 'date' | 'count';
  endDate?: Date;
  endCount?: number;
}

export interface ClassInstance {
  startTime: Date;
  endTime: Date;
}

export function generateRecurringInstances(
  baseStartTime: Date,
  baseEndTime: Date,
  rule: RecurrenceRule
): ClassInstance[] {
  const instances: ClassInstance[] = [];
  const duration = baseEndTime.getTime() - baseStartTime.getTime();
  
  // Define the Pacific timezone
  const pacificTimeZone = 'America/Los_Angeles';
  
  // Convert the base UTC time to Pacific time for date arithmetic
  const baseStartPacific = toZonedTime(baseStartTime, pacificTimeZone);
  console.log(`Base start time - UTC: ${baseStartTime.toISOString()}, Pacific: ${baseStartPacific}`);
  
  let currentDate = new Date(baseStartPacific);
  let count = 0;
  const maxInstances = rule.endType === 'count' ? (rule.endCount || 1) : 100; // Safety limit
  
  while (count < maxInstances) {
    // Check if we've reached the end date (convert end date to Pacific for comparison)
    if (rule.endType === 'date' && rule.endDate) {
      const endDatePacific = toZonedTime(rule.endDate, pacificTimeZone);
      if (isAfter(currentDate, endDatePacific)) {
        break;
      }
    }
    
    // For weekly recurrence, check if current day is in the allowed days
    if (rule.type === 'weekly' && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      const currentDayOfWeek = currentDate.getDay();
      console.log(`Checking day: ${currentDate.toISOString()} (Pacific), dayOfWeek: ${currentDayOfWeek}, allowed: ${rule.daysOfWeek}`);
      if (rule.daysOfWeek.includes(currentDayOfWeek)) {
        // Convert back to UTC for storage
        const utcStartTime = fromZonedTime(currentDate, pacificTimeZone);
        const utcEndTime = new Date(utcStartTime.getTime() + duration);
        
        instances.push({
          startTime: utcStartTime,
          endTime: utcEndTime
        });
        count++;
        console.log(`Created instance for day ${currentDayOfWeek} - Pacific: ${currentDate.toISOString()}, UTC: ${utcStartTime.toISOString()}`);
      }
    } else {
      // For daily and monthly, or weekly without specific days
      const utcStartTime = fromZonedTime(currentDate, pacificTimeZone);
      const utcEndTime = new Date(utcStartTime.getTime() + duration);
      
      instances.push({
        startTime: utcStartTime,
        endTime: utcEndTime
      });
      count++;
    }
    
    // Move to next occurrence (all date arithmetic in Pacific time)
    switch (rule.type) {
      case 'daily':
        currentDate = addDays(currentDate, rule.interval);
        break;
      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          // Find next day in the week
          const currentDayOfWeek = currentDate.getDay();
          const sortedDays = [...rule.daysOfWeek].sort();
          const nextDay = sortedDays.find(day => day > currentDayOfWeek);
          
          console.log(`Moving to next occurrence - current day: ${currentDayOfWeek}, sorted days: ${sortedDays}, next day: ${nextDay}`);
          
          if (nextDay !== undefined) {
            // Next occurrence this week
            const daysToAdd = nextDay - currentDayOfWeek;
            console.log(`Next occurrence this week - adding ${daysToAdd} days`);
            currentDate = addDays(currentDate, daysToAdd);
          } else {
            // Next occurrence next week (first day of allowed days)
            const daysUntilNextWeek = 7 - currentDayOfWeek + sortedDays[0];
            console.log(`Next occurrence next week - adding ${daysUntilNextWeek} days`);
            currentDate = addDays(currentDate, daysUntilNextWeek);
          }
          console.log(`New current date after advancement: ${currentDate.toISOString()} (Pacific), day: ${currentDate.getDay()}`);
        } else {
          currentDate = addWeeks(currentDate, rule.interval);
        }
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, rule.interval);
        break;
    }
    
    // Safety check to prevent infinite loops
    if (instances.length > 365) { // Max 1 year of instances
      console.warn('Stopping recurrence generation after 365 instances');
      break;
    }
  }
  
  return instances;
}

export function parseRecurrenceRule(classData: any): RecurrenceRule | null {
  if (!classData.isRecurring || !classData.recurrenceType) {
    return null;
  }
  
  const rule: RecurrenceRule = {
    type: classData.recurrenceType,
    interval: classData.recurrenceInterval || 1,
    endType: classData.recurrenceEndType || 'count'
  };
  
  // Parse days of week if it's a JSON string
  if (classData.recurrenceDaysOfWeek) {
    try {
      rule.daysOfWeek = JSON.parse(classData.recurrenceDaysOfWeek);
    } catch (error) {
      console.error('Error parsing recurrence days of week:', error);
    }
  }
  
  // Parse end date
  if (rule.endType === 'date' && classData.recurrenceEndDate) {
    rule.endDate = typeof classData.recurrenceEndDate === 'string' 
      ? new Date(classData.recurrenceEndDate) 
      : classData.recurrenceEndDate;
  }
  
  // Set end count
  if (rule.endType === 'count' && classData.recurrenceEndCount) {
    rule.endCount = classData.recurrenceEndCount;
  }
  
  return rule;
}