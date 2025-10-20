import { storage } from './storage';
import { 
  sendClassReminder, 
  sendClassCancellationNotification,
  sendClassScheduleUpdateNotification,
  sendPostClassFeedbackEmail,
  sendWeeklyNewsletterEmail
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

// Post-class feedback email scheduler - sends emails 1 hour after class completion
export async function sendPostClassFeedbackEmails(): Promise<void> {
  console.log('Starting post-class feedback email process...');
  
  try {
    const now = new Date();
    
    // Find classes that ended approximately 1 hour ago (with 15-minute tolerance window)
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago
    const startWindow = new Date(oneHourAgo.getTime() - (15 * 60 * 1000)); // 15 mins before
    const endWindow = new Date(oneHourAgo.getTime() + (15 * 60 * 1000)); // 15 mins after
    
    console.log(`Looking for classes that ended between ${startWindow.toISOString()} and ${endWindow.toISOString()}`);
    
    // Get all classes that ended in the target window
    const completedClasses = await storage.getClassesEndedInTimeWindow(startWindow, endWindow);
    console.log(`Found ${completedClasses.length} classes that ended in the target window`);
    
    if (completedClasses.length === 0) {
      console.log('No classes completed in the target window, skipping feedback emails');
      return;
    }
    
    let emailsSent = 0;
    
    for (const classData of completedClasses) {
      console.log(`Processing feedback emails for class: ${classData.title} (ID: ${classData.id})`);
      
      // Get all active bookings for this class
      const bookings = await storage.getActiveBookingsForClass(classData.id);
      console.log(`Found ${bookings.length} active bookings for class ${classData.id}`);
      
      if (bookings.length === 0) {
        console.log(`No active bookings for class ${classData.id}, skipping`);
        continue;
      }
      
      // Get coach information
      const coach = await storage.getUser(classData.coachId);
      if (!coach) {
        console.log(`Coach not found for class ${classData.id}, skipping`);
        continue;
      }
      
      for (const booking of bookings) {
        try {
          // Check if we've already sent feedback email for this booking
          const alreadySent = await storage.hasPostClassFeedbackEmailBeenSent(booking.id);
          if (alreadySent) {
            console.log(`Feedback email already sent for booking ${booking.id}, skipping`);
            continue;
          }
          
          // Get customer information
          const customer = await storage.getUser(booking.userId);
          if (!customer) {
            console.log(`Customer not found for booking ${booking.id}, skipping`);
            continue;
          }
          
          // Send the post-class feedback email
          const emailSent = await sendPostClassFeedbackEmail({
            booking,
            classData,
            customer,
            coach
          });
          
          if (emailSent) {
            // Mark this booking as having received feedback email
            await storage.markPostClassFeedbackEmailSent(booking.id);
            emailsSent++;
            console.log(`✅ Feedback email sent for booking ${booking.id} to ${customer.email}`);
          } else {
            console.log(`❌ Failed to send feedback email for booking ${booking.id}`);
          }
        } catch (bookingError) {
          console.error(`Error processing feedback email for booking ${booking.id}:`, bookingError);
        }
      }
    }
    
    console.log(`✅ Post-class feedback email process completed. Sent ${emailsSent} emails.`);
  } catch (error) {
    console.error('Error in post-class feedback email process:', error);
    throw error;
  }
}

// Weekly newsletter scheduler - sends every Sunday at 2:00 PM PST
export async function sendWeeklyNewsletters(): Promise<void> {
  console.log('Starting weekly newsletter process...');
  
  try {
    // Get all customers for newsletter
    const customers = await storage.getAllCustomersForNewsletter();
    console.log(`Found ${customers.length} customers for newsletter`);
    
    if (customers.length === 0) {
      console.log('No customers found for newsletter, skipping');
      return;
    }
    
    // Fetch newsletter data once for all customers
    console.log('Fetching newsletter data...');
    const [upcomingKidsClasses, upcomingAdultClasses, newProviders, recentReviews] = await Promise.all([
      storage.getUpcomingKidsClassesForNewsletter(),
      storage.getUpcomingAdultClassesForNewsletter(), 
      storage.getRecentlyJoinedProviders(30), // Last 30 days
      storage.getRecentReviewsForNewsletter()
    ]);
    
    console.log(`Newsletter data: ${upcomingKidsClasses.length} kids classes, ${upcomingAdultClasses.length} adult classes, ${newProviders.length} new providers, ${recentReviews.length} reviews`);
    
    // Check if there's enough content for newsletter
    const totalClasses = upcomingKidsClasses.length + upcomingAdultClasses.length;
    if (totalClasses === 0) {
      console.log('No upcoming classes found, skipping newsletter this week');
      return;
    }
    
    let emailsSent = 0;
    let emailsSkipped = 0;
    let emailsSkippedDueToPreference = 0;
    
    // Send newsletter to each customer
    for (const customer of customers) {
      try {
        // DOUBLE-CHECK: Verify customer still wants newsletter before sending
        // This prevents race conditions where preference changed after initial query
        const currentCustomer = await storage.getUser(customer.id);
        
        if (!currentCustomer || !currentCustomer.receiveNewsletter) {
          emailsSkipped++;
          emailsSkippedDueToPreference++;
          console.log(`⏭️  Skipping ${customer.email} - newsletter preference is now FALSE (Customer ID: ${customer.id})`);
          continue;
        }
        
        const emailSent = await sendWeeklyNewsletterEmail({
          customer,
          upcomingKidsClasses,
          upcomingAdultClasses,
          newProviders,
          recentReviews
        });
        
        if (emailSent) {
          emailsSent++;
          console.log(`✅ Newsletter sent to ${customer.email}`);
        } else {
          emailsSkipped++;
          console.log(`❌ Failed to send newsletter to ${customer.email}`);
        }
        
        // Add small delay to avoid rate limiting (150ms between emails)
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (customerError) {
        emailsSkipped++;
        console.error(`Error sending newsletter to ${customer.email}:`, customerError);
      }
    }
    
    console.log(`✅ Weekly newsletter process completed. Sent: ${emailsSent}, Skipped: ${emailsSkipped} (${emailsSkippedDueToPreference} due to preference change)`);
    
  } catch (error) {
    console.error('Error in weekly newsletter process:', error);
    throw error;
  }
}

// Weekly newsletter with database idempotency - prevents duplicate sends
export async function sendWeeklyNewslettersWithIdempotency(): Promise<void> {
  const timeZone = 'America/Los_Angeles';
  const now = new Date();
  const nowInPT = toZonedTime(now, timeZone);
  
  // Get current week identifier (using Sunday as start of week)
  const currentSunday = new Date(nowInPT);
  const daysSinceSunday = currentSunday.getDay();
  currentSunday.setDate(currentSunday.getDate() - daysSinceSunday);
  const weekId = formatInTimeZone(currentSunday, timeZone, 'yyyy-MM-dd');
  
  console.log(`Starting weekly newsletter process for week of ${weekId}...`);
  
  try {
    // Check if we've already sent newsletter for this week
    const processType = 'weekly_newsletter';
    const lastProcessed = await storage.getEmailReminderTracking(processType);
    
    if (lastProcessed && lastProcessed.lastProcessedDate === weekId) {
      console.log(`[IDEMPOTENCY] Weekly newsletter already sent for week of ${weekId}, skipping...`);
      return;
    }
    
    await sendWeeklyNewsletters();
    
    // Mark this week as processed
    await storage.upsertEmailReminderTracking(processType, weekId);
    console.log(`✓ Weekly newsletter completed and marked as processed for week of ${weekId}`);
    
  } catch (error) {
    console.error('Error in weekly newsletter process with idempotency:', error);
    throw error;
  }
}

// Check if it's Sunday and time to send newsletter (2:00 PM PST)
export function shouldSendWeeklyNewsletter(): boolean {
  const timeZone = 'America/Los_Angeles';
  const nowInPT = toZonedTime(new Date(), timeZone);
  
  const isSunday = nowInPT.getDay() === 0; // Sunday = 0
  const currentHour = nowInPT.getHours();
  const isCorrectTime = currentHour >= 14; // 2:00 PM or later
  
  return isSunday && isCorrectTime;
}

// Startup check for weekly newsletter catch-up
export async function performWeeklyNewsletterCatchupIfNeeded(): Promise<boolean> {
  if (!shouldSendWeeklyNewsletter()) {
    console.log('⏰ Not Sunday afternoon, no weekly newsletter catch-up needed');
    return false;
  }
  
  const timeZone = 'America/Los_Angeles';
  const nowInPT = toZonedTime(new Date(), timeZone);
  
  // Get current week identifier
  const currentSunday = new Date(nowInPT);
  const daysSinceSunday = currentSunday.getDay();
  currentSunday.setDate(currentSunday.getDate() - daysSinceSunday);
  const weekId = formatInTimeZone(currentSunday, timeZone, 'yyyy-MM-dd');
  
  // Check if we've already processed this week
  const processType = 'weekly_newsletter';
  const lastProcessed = await storage.getEmailReminderTracking(processType);
  
  if (lastProcessed && lastProcessed.lastProcessedDate === weekId) {
    console.log(`✓ Weekly newsletter already processed for week of ${weekId}, no catch-up needed`);
    return false;
  }
  
  console.log(`🚀 STARTUP CATCH-UP: Running weekly newsletter for week of ${weekId}...`);
  await sendWeeklyNewslettersWithIdempotency();
  return true;
}