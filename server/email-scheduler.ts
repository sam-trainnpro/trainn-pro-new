import { storage } from './storage';
import { 
  sendClassReminder, 
  sendClassCancellationNotification,
  sendClassScheduleUpdateNotification 
} from './email';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { addDays, startOfDay, endOfDay } from 'date-fns';

// Enhanced class reminder scheduler with production idempotency
export async function sendDailyClassRemindersWithDatabaseIdempotency(): Promise<void> {
  const timeZone = 'America/Los_Angeles';
  const now = new Date();
  const nowInPT = toZonedTime(now, timeZone);
  const todayPTDateStr = formatInTimeZone(nowInPT, timeZone, 'yyyy-MM-dd');
  
  console.log(`Starting daily class reminder process for ${todayPTDateStr}...`);
  
  try {
    // Check if we've already processed reminders today
    const processType = 'daily_class_reminders';
    const lastProcessed = await storage.getEmailReminderTracking(processType);
    
    if (lastProcessed && lastProcessed.lastProcessedDate === todayPTDateStr) {
      console.log(`[IDEMPOTENCY] Daily class reminders already sent for ${todayPTDateStr}, skipping...`);
      return;
    }
    
    await sendDailyClassReminders();
    
    // Mark today as processed
    await storage.upsertEmailReminderTracking(processType, todayPTDateStr);
    console.log(`✓ Daily class reminders completed and marked as processed for ${todayPTDateStr}`);
    
  } catch (error) {
    console.error('Error in daily class reminder process with database idempotency:', error);
    throw error;
  }
}

// Catch-up logic: Check if today needs processing and run if so
export async function performStartupCatchupIfNeeded(): Promise<boolean> {
  const timeZone = 'America/Los_Angeles';
  const now = new Date();
  const nowInPT = toZonedTime(now, timeZone);
  const todayPTDateStr = formatInTimeZone(nowInPT, timeZone, 'yyyy-MM-dd');
  
  // Check if it's after 9 AM PT today
  const today9AMPT = new Date(`${todayPTDateStr}T09:00:00`);
  const today9AMPTUTC = fromZonedTime(today9AMPT, timeZone);
  
  if (now < today9AMPTUTC) {
    console.log(`⏰ Current time is before 9 AM PT today, no catch-up needed`);
    return false;
  }
  
  // Check if we've already processed today
  const processType = 'daily_class_reminders';
  const lastProcessed = await storage.getEmailReminderTracking(processType);
  
  if (lastProcessed && lastProcessed.lastProcessedDate === todayPTDateStr) {
    console.log(`✓ Daily class reminders already processed for ${todayPTDateStr}, no catch-up needed`);
    return false;
  }
  
  console.log(`🚀 STARTUP CATCH-UP: Running daily class reminders for ${todayPTDateStr}...`);
  await sendDailyClassRemindersWithDatabaseIdempotency();
  return true;
}

// Original class reminder scheduler (should be called daily)
export async function sendDailyClassReminders(): Promise<void> {
  console.log('Starting daily class reminder process...');
  
  try {
    const timeZone = 'America/Los_Angeles';
    const now = new Date();
    
    // Get tomorrow's date string in Pacific timezone
    const nowInPT = toZonedTime(now, timeZone);
    const tomorrowInPT = addDays(nowInPT, 1);
    const tomorrowDateStr = formatInTimeZone(tomorrowInPT, timeZone, 'yyyy-MM-dd');
    
    // Create PT wall-time strings for tomorrow's boundaries
    const tomorrowStartPTString = `${tomorrowDateStr}T00:00:00`;
    const tomorrowEndPTString = `${tomorrowDateStr}T23:59:59`;
    
    // Convert PT wall-time strings to UTC for database filtering
    const tomorrowStartPT = new Date(tomorrowStartPTString);
    const tomorrowEndPT = new Date(tomorrowEndPTString);
    const tomorrowStartUTC = fromZonedTime(tomorrowStartPT, timeZone);
    const tomorrowEndUTC = fromZonedTime(tomorrowEndPT, timeZone);
    
    console.log(`Looking for classes between ${tomorrowStartUTC.toISOString()} and ${tomorrowEndUTC.toISOString()} (tomorrow in PT)`);
    
    const classes = await storage.getClasses();
    const tomorrowClasses = classes.filter(classItem => {
      if (!classItem.startTime) return false;
      const classDate = new Date(classItem.startTime);
      return classDate >= tomorrowStartUTC && classDate <= tomorrowEndUTC;
    });
    
    console.log(`Found ${tomorrowClasses.length} classes starting tomorrow (PT)`);
    
    // For each class, get bookings and send reminders
    for (const classItem of tomorrowClasses) {
      try {
        const bookings = await storage.getClassBookings(classItem.id);
        const activeBookings = bookings.filter(booking => booking.status === 'confirmed');
        
        if (activeBookings.length === 0) {
          console.log(`No active bookings for class ${classItem.title}`);
          continue;
        }
        
        // Get coach details
        const coach = await storage.getUser(classItem.coachId);
        if (!coach) {
          console.error(`Coach not found for class ${classItem.id}`);
          continue;
        }
        
        // Send reminder to each customer
        for (const booking of activeBookings) {
          const customer = await storage.getUser(booking.userId);
          if (!customer) {
            console.error(`Customer not found for booking ${booking.id}`);
            continue;
          }
          
          await sendClassReminder(customer, classItem, coach);
          console.log(`Reminder sent to ${customer.email} for class ${classItem.title}`);
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error sending reminders for class ${classItem.id}:`, error);
      }
    }
    
    console.log('Daily class reminder process completed');
  } catch (error) {
    console.error('Error in daily class reminder process:', error);
  }
}

// Track which days we've sent reminders for (development mode idempotency)
const sentReminderDates = new Set<string>();

// Enhanced version with development mode idempotency
export async function sendDailyClassRemindersWithIdempotency(): Promise<void> {
  const timeZone = 'America/Los_Angeles';
  const now = new Date();
  const nowInPT = toZonedTime(now, timeZone);
  const todayDateKey = nowInPT.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // In development mode, prevent duplicate sends on the same day
  if (process.env.NODE_ENV !== 'production' && sentReminderDates.has(todayDateKey)) {
    console.log(`[DEV] Skipping reminders - already sent today (${todayDateKey})`);
    return;
  }
  
  try {
    await sendDailyClassReminders();
    
    // Mark this date as processed in development mode
    if (process.env.NODE_ENV !== 'production') {
      sentReminderDates.add(todayDateKey);
      
      // Clean up old dates to prevent memory leaks (keep only last 7 days)
      const sevenDaysAgo = addDays(nowInPT, -7).toISOString().split('T')[0];
      Array.from(sentReminderDates).forEach(dateKey => {
        if (dateKey < sevenDaysAgo) {
          sentReminderDates.delete(dateKey);
        }
      });
    }
  } catch (error) {
    console.error('Error in daily class reminder process with idempotency:', error);
    throw error;
  }
}

// Utility function to send class cancellation notifications to all booked customers
export async function sendClassCancellationNotifications(
  classId: number, 
  reason?: string
): Promise<void> {
  try {
    console.log(`Starting class cancellation notifications for class ${classId}`);
    
    const classItem = await storage.getClass(classId);
    if (!classItem) {
      throw new Error('Class not found');
    }
    
    const coach = await storage.getUser(classItem.coachId);
    if (!coach) {
      throw new Error('Coach not found');
    }
    
    const bookings = await storage.getClassBookings(classId);
    const activeBookings = bookings.filter(booking => booking.status === 'confirmed');
    
    console.log(`Found ${activeBookings.length} active bookings to notify`);
    
    for (const booking of activeBookings) {
      const customer = await storage.getUser(booking.userId);
      if (!customer) {
        console.error(`Customer not found for booking ${booking.id}`);
        continue;
      }
      
      await sendClassCancellationNotification(customer, classItem, coach, reason);
      console.log(`Cancellation notification sent to ${customer.email}`);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Class cancellation notifications completed');
  } catch (error) {
    console.error('Error sending class cancellation notifications:', error);
    throw error;
  }
}

// Utility function to send class update notifications to all booked customers
export async function sendClassUpdateNotifications(
  classId: number,
  oldClassData: any,
  newClassData: any,
  changes: string[]
): Promise<void> {
  try {
    console.log(`Starting class update notifications for class ${classId}`);
    
    const coach = await storage.getUser(newClassData.coachId);
    if (!coach) {
      throw new Error('Coach not found');
    }
    
    const bookings = await storage.getClassBookings(classId);
    const activeBookings = bookings.filter(booking => booking.status === 'confirmed');
    
    console.log(`Found ${activeBookings.length} active bookings to notify`);
    
    for (const booking of activeBookings) {
      const customer = await storage.getUser(booking.userId);
      if (!customer) {
        console.error(`Customer not found for booking ${booking.id}`);
        continue;
      }
      
      await sendClassScheduleUpdateNotification(
        customer, 
        oldClassData, 
        newClassData, 
        coach, 
        changes
      );
      console.log(`Update notification sent to ${customer.email}`);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Class update notifications completed');
  } catch (error) {
    console.error('Error sending class update notifications:', error);
    throw error;
  }
}