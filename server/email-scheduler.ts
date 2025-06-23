import { storage } from './storage';
import { 
  sendClassReminder, 
  sendClassCancellationNotification,
  sendClassScheduleUpdateNotification 
} from './email';

// Class reminder scheduler (should be called daily)
export async function sendDailyClassReminders(): Promise<void> {
  console.log('Starting daily class reminder process...');
  
  try {
    // Get all classes starting in 24 hours (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    const classes = await storage.getClasses();
    const tomorrowClasses = classes.filter(classItem => {
      if (!classItem.startTime) return false;
      const classDate = new Date(classItem.startTime);
      return classDate >= tomorrow && classDate < dayAfterTomorrow;
    });
    
    console.log(`Found ${tomorrowClasses.length} classes starting tomorrow`);
    
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