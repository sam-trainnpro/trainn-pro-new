import { 
  users, type User, type InsertUser, 
  classes, type Class, type InsertClass, 
  bookings, type Booking, type InsertBooking, 
  reviews, type Review, type InsertReview, 
  classCategories, type ClassCategory, type InsertClassCategory,
  classSchedules, type ClassSchedule, type InsertClassSchedule, type ClassWithSchedules,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken,
  contactMessages, type ContactMessage, type InsertContactMessage,
  blogPosts, type BlogPost, type InsertBlogPost,
  scheduledPayouts, type ScheduledPayout, type InsertScheduledPayout
} from "@shared/schema";
import { generateRecurringInstances, parseRecurrenceRule } from "./recurrence-utils";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, inArray, sql, lt } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

// Extended storage interface
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getCoaches(): Promise<User[]>;
  getApprovedCoaches(): Promise<User[]>;
  approveCoach(id: number): Promise<User | undefined>;
  
  // Class categories
  createClassCategory(category: InsertClassCategory): Promise<ClassCategory>;
  getAllClassCategories(): Promise<ClassCategory[]>;
  getCategoriesWithFutureClasses(): Promise<ClassCategory[]>;
  getClassCategory(id: number): Promise<ClassCategory | undefined>;
  
  // City data
  getClassCities(): Promise<string[]>;
  
  // Classes
  createClass(classData: InsertClass): Promise<Class>;
  createRecurringClass(classData: InsertClass): Promise<Class>;
  getClass(id: number): Promise<Class | undefined>;
  getClassWithSchedules(id: number): Promise<ClassWithSchedules | undefined>;
  getClasses(): Promise<Class[]>;
  getClassesWithSchedules(): Promise<ClassWithSchedules[]>;
  getUserClasses(userId: number): Promise<Class[]>;
  getClassesByCategory(categoryId: number): Promise<Class[]>;
  getClassesByCoach(coachId: number): Promise<Class[]>;
  updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined>;
  updateClassSeries(parentClassId: number, classData: Partial<Class>): Promise<Class[]>;
  getClassesByParentId(parentClassId: number): Promise<Class[]>;
  getClassesBySeriesId(seriesId: string): Promise<Class[]>;
  deleteClass(id: number): Promise<boolean>;
  deleteRecurringClassSeries(seriesId: string): Promise<boolean>;
  deleteThisAndFollowingClasses(classId: number): Promise<boolean>;
  
  // Class Schedules
  createClassSchedule(scheduleData: InsertClassSchedule): Promise<ClassSchedule>;
  getClassSchedules(classId: number): Promise<ClassSchedule[]>;
  deleteClassSchedule(id: number): Promise<boolean>;
  
  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getClassBookings(classId: number): Promise<Booking[]>;
  updateBooking(id: number, booking: Partial<Booking>): Promise<Booking | undefined>;
  
  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getClassReviews(classId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  getReviewByClassAndBooking(classId: number, bookingId: number): Promise<Review | undefined>;
  updateReview(id: number, review: Partial<Review>): Promise<Review | undefined>;
  getClassRatingStats(classId: number): Promise<{ averageRating: number; totalReviews: number }>;
  getCoachRatingStats(coachId: number): Promise<{ averageRating: number; totalReviews: number }>;
  
  // Stripe
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  
  // Password reset
  createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<boolean>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;
  
  // Contact messages
  createContactMessage(messageData: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  
  // Customer management
  getCustomersForCoach(coachId: number, userRole: string): Promise<any[]>;
  getAllCustomerBookings(): Promise<any[]>;
  
  // Blog posts
  createBlogPost(postData: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPosts(filters?: { status?: string }): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  updateBlogPost(id: number, postData: Partial<BlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // Scheduled Payouts
  createScheduledPayout(payoutData: InsertScheduledPayout): Promise<ScheduledPayout>;
  getScheduledPayouts(filters?: { status?: string }): Promise<ScheduledPayout[]>;
  getScheduledPayoutsByClass(classId: number): Promise<ScheduledPayout[]>;
  getScheduledPayoutsByCoach(coachId: number): Promise<ScheduledPayout[]>;
  updateScheduledPayout(id: number, payoutData: Partial<ScheduledPayout>): Promise<ScheduledPayout | undefined>;
  getDueScheduledPayouts(): Promise<ScheduledPayout[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize the database with sample categories
    this.initializeCategories();
  }
  
  private async initializeCategories() {
    try {
      // Check if categories already exist
      const existingCategories = await this.getAllClassCategories();
      
      if (existingCategories.length === 0) {
        // If no categories exist, create them
        const categories = [
          { name: 'HIIT', image: 'https://images.unsplash.com/photo-1517130038641-a774d04afb3c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
          { name: 'Yoga', image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
          { name: 'Strength', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
          { name: 'Cardio', image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
          { name: 'Soccer', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400' },
          { name: 'Pilates', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400' },
          { name: 'Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400' },
          { name: 'Baseball', image: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400' },
          { name: 'Dance', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400' },
        ];
        
        for (const category of categories) {
          await this.createClassCategory(category);
        }
      }
    } catch (error) {
      console.error("Error initializing categories:", error);
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...userData,
      createdAt: new Date(),
      isApproved: userData.role === 'customer' || userData.role === 'admin'
    }).returning();
    
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getCoaches(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'coach'));
  }
  
  async getApprovedCoaches(): Promise<User[]> {
    return await db.select().from(users).where(
      and(
        eq(users.role, 'coach'),
        eq(users.isApproved, true)
      )
    );
  }
  
  async approveCoach(id: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ isApproved: true })
      .where(
        and(
          eq(users.id, id),
          eq(users.role, 'coach')
        )
      )
      .returning();
    
    return result[0];
  }
  
  // Class category methods
  async createClassCategory(category: InsertClassCategory): Promise<ClassCategory> {
    const result = await db.insert(classCategories)
      .values(category)
      .returning();
    
    return result[0];
  }
  
  async getAllClassCategories(): Promise<ClassCategory[]> {
    return await db.select().from(classCategories);
  }
  
  async getCategoriesWithFutureClasses(): Promise<ClassCategory[]> {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT cc.id, cc.name, cc.image
        FROM class_categories cc
        INNER JOIN classes c ON cc.id = c.category_id
        WHERE c.start_time >= CURRENT_DATE
        ORDER BY cc.name
      `);
      
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        image: row.image
      }));
    } catch (error) {
      console.error("Error getting categories with future classes:", error);
      return [];
    }
  }
  
  async getClassCategory(id: number): Promise<ClassCategory | undefined> {
    const result = await db.select().from(classCategories).where(eq(classCategories.id, id));
    return result[0];
  }

  // Get unique cities from class addresses for upcoming classes only
  async getClassCities(): Promise<string[]> {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT 
          TRIM(SPLIT_PART(address, ',', -2)) as city
        FROM classes 
        WHERE address IS NOT NULL 
          AND address != '' 
          AND TRIM(SPLIT_PART(address, ',', -2)) != ''
          AND start_time >= CURRENT_DATE
        ORDER BY city
      `);
      
      return result.rows.map((row: any) => row.city).filter(city => city);
    } catch (error) {
      console.error("Error getting class cities:", error);
      return [];
    }
  }
  
  // Class methods
  async createClass(classData: InsertClass): Promise<Class> {
    try {
      console.log("Creating class with data in storage:", classData);
      
      // Ensure all required fields are present and properly formatted
      const formattedData = {
        ...classData,
        // Ensure numeric fields are correctly typed
        coachId: Number(classData.coachId),
        categoryId: Number(classData.categoryId),
        price: Number(classData.price),
        capacity: Number(classData.capacity),
        // Handle date fields
        startTime: classData.startTime ? new Date(classData.startTime) : undefined,
        endTime: classData.endTime ? new Date(classData.endTime) : undefined,
        // Add created timestamp
        createdAt: new Date()
      };
      
      console.log("Formatted class data:", formattedData);
      
      // Check if this is a recurring class
      if (classData.isRecurring && classData.startTime && classData.endTime) {
        return await this.createRecurringClass(formattedData);
      } else {
        // Create single class instance
        const result = await db.insert(classes)
          .values(formattedData)
          .returning();
        
        console.log("Single class created successfully:", result[0]);
        return result[0];
      }
    } catch (error) {
      console.error("Error in storage.createClass:", error);
      throw error;
    }
  }

  // Create recurring class instances - each instance is its own database row
  async createRecurringClass(classData: InsertClass): Promise<Class> {
    try {
      const recurrenceRule = parseRecurrenceRule(classData);
      
      if (!recurrenceRule || !classData.startTime || !classData.endTime) {
        throw new Error("Invalid recurrence rule or missing start/end times");
      }
      
      console.log("Creating recurring class with rule:", recurrenceRule);
      
      // Generate recurring instances
      const instances = generateRecurringInstances(
        new Date(classData.startTime),
        new Date(classData.endTime),
        recurrenceRule
      );
      
      console.log(`Generated ${instances.length} recurring instances`);
      
      // Generate a unique series ID for all instances in this recurring series
      const seriesId = `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create all class instances as individual database rows
      const instancePromises = instances.map(async (instance, index) => {
        const instanceData = {
          ...classData,
          title: `${classData.title}`, // Keep original title
          isRecurring: false, // Individual instances are not recurring themselves
          recurringSeriesId: seriesId, // Link all instances with same series ID
          startTime: instance.startTime,
          endTime: instance.endTime
        };
        
        // Remove all recurrence fields for instances since they're individual classes now
        delete instanceData.recurrenceType;
        delete instanceData.recurrenceInterval;
        delete instanceData.recurrenceDaysOfWeek;
        delete instanceData.recurrenceEndType;
        delete instanceData.recurrenceEndDate;
        delete instanceData.recurrenceEndCount;
        delete instanceData.parentClassId; // No parent class needed
        
        return db.insert(classes)
          .values(instanceData)
          .returning();
      });
      
      const instanceResults = await Promise.all(instancePromises);
      console.log(`Created ${instanceResults.length} individual class instances with series ID: ${seriesId}`);
      
      // Return the first instance as the "representative" class
      return instanceResults[0][0];
    } catch (error) {
      console.error("Error creating recurring class:", error);
      throw error;
    }
  }
  
  // Class Schedule methods
  async createClassSchedule(scheduleData: InsertClassSchedule): Promise<ClassSchedule> {
    try {
      console.log("Creating class schedule:", scheduleData);
      const result = await db.insert(classSchedules)
        .values({
          ...scheduleData,
          createdAt: new Date()
        })
        .returning();
        
      return result[0];
    } catch (error) {
      console.error("Error creating class schedule:", error);
      throw error;
    }
  }
  
  async getClassSchedules(classId: number): Promise<ClassSchedule[]> {
    try {
      return await db.select()
        .from(classSchedules)
        .where(eq(classSchedules.classId, classId));
    } catch (error) {
      console.error("Error fetching class schedules:", error);
      return [];
    }
  }
  
  async deleteClassSchedule(id: number): Promise<boolean> {
    try {
      await db.delete(classSchedules)
        .where(eq(classSchedules.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting class schedule:", error);
      return false;
    }
  }
  
  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.id, id));
    return result[0];
  }
  
  async getClassWithSchedules(id: number): Promise<ClassWithSchedules | undefined> {
    const classResult = await this.getClass(id);
    if (!classResult) return undefined;
    
    const schedules = await this.getClassSchedules(id);
    return {
      ...classResult,
      schedules,
    };
  }
  
  async getClasses(): Promise<Class[]> {
    try {
      // Get all classes, sorted by most recent first
      // If the class has a startTime (specific class instance), order by that first
      // If no startTime, order by createdAt
      const result = await db.select().from(classes)
        .orderBy(
          sql`CASE 
              WHEN start_time IS NOT NULL THEN 0
              ELSE 1
             END`,
          // Then order by date - either start_time or created_at
          sql`CASE 
              WHEN start_time IS NOT NULL THEN start_time
              ELSE created_at
             END`
        );
      
      return result;
    } catch (error) {
      console.error("Error getting classes:", error);
      throw error;
    }
  }
  
  async getClassesWithSchedules(): Promise<ClassWithSchedules[]> {
    const allClasses = await this.getClasses();
    const classesWithSchedules: ClassWithSchedules[] = [];
    
    for (const classItem of allClasses) {
      const schedules = await this.getClassSchedules(classItem.id);
      classesWithSchedules.push({
        ...classItem,
        schedules,
      });
    }
    
    return classesWithSchedules;
  }
  
  async getUserClasses(userId: number): Promise<Class[]> {
    // Get all classes that the user has booked
    const userBookings = await this.getUserBookings(userId);
    const classIds = userBookings.map(booking => booking.classId);
    
    if (classIds.length === 0) {
      return [];
    }
    
    return await db.select().from(classes).where(
      inArray(classes.id, classIds)
    );
  }
  
  async getClassesByCategory(categoryId: number): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.categoryId, categoryId));
  }
  
  async getClassesByCoach(coachId: number): Promise<Class[]> {
    // Only return classes with valid start times (exclude parent recurring templates)
    return await db.select().from(classes)
      .where(and(
        eq(classes.coachId, coachId),
        sql`${classes.startTime} IS NOT NULL`
      ));
  }
  
  async updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined> {
    try {
      console.log("Updating class with ID:", id);
      console.log("Class data to update:", classData);
      
      const result = await db.update(classes)
        .set(classData)
        .where(eq(classes.id, id))
        .returning();
      
      console.log("Update result:", result);
      return result[0];
    } catch (error) {
      console.error("Error in updateClass:", error);
      throw error;
    }
  }
  
  async getClassesByParentId(parentClassId: number): Promise<Class[]> {
    return await db.select()
      .from(classes)
      .where(eq(classes.parentClassId, parentClassId));
  }
  
  async getClassesByRecurringSeriesId(recurringSeriesId: string): Promise<Class[]> {
    return await db.select()
      .from(classes)
      .where(eq(classes.recurringSeriesId, recurringSeriesId));
  }
  
  async updateClassSeries(classId: number, classData: Partial<Class>): Promise<Class[]> {
    // Get the class to find its recurring series ID
    const targetClass = await this.getClass(classId);
    if (!targetClass?.recurringSeriesId) {
      throw new Error("Class is not part of a recurring series");
    }
    
    // Get all classes in the series
    const seriesClasses = await this.getClassesByRecurringSeriesId(targetClass.recurringSeriesId);
    
    // Check if duration has changed by comparing startTime and endTime
    let newDurationMs: number | null = null;
    if (classData.startTime && classData.endTime) {
      newDurationMs = new Date(classData.endTime).getTime() - new Date(classData.startTime).getTime();
    }
    
    // Exclude startTime and endTime from the base update data since each instance has its own timing
    const { startTime, endTime, ...updateData } = classData;
    
    // Update all classes in the series
    const updatedClasses: Class[] = [];
    for (const seriesClass of seriesClasses) {
      // Prepare the update data for this specific class instance
      const instanceUpdateData = { ...updateData };
      
      // If duration has changed, recalculate endTime for this instance
      if (newDurationMs !== null && seriesClass.startTime) {
        const classStartTime = new Date(seriesClass.startTime);
        const newEndTime = new Date(classStartTime.getTime() + newDurationMs);
        instanceUpdateData.endTime = newEndTime;
      }
      
      const result = await db.update(classes)
        .set(instanceUpdateData)
        .where(eq(classes.id, seriesClass.id))
        .returning();
      
      if (result.length > 0) {
        updatedClasses.push(result[0]);
      }
    }
    
    return updatedClasses;
  }
  
  async deleteClass(id: number): Promise<boolean> {
    try {
      // Get the class to see if it's part of a series
      const classItem = await this.getClass(id);
      if (!classItem) {
        console.log(`Class with id ${id} not found for deletion`);
        return false;
      }
      
      console.log(`Deleting class: ${id}, isRecurring: ${classItem.isRecurring}, parentClassId: ${classItem.parentClassId}`);
      
      // Helper function to delete bookings for a class
      const deleteBookingsForClass = async (classId: number) => {
        console.log(`Deleting bookings for class ${classId}`);
        await db.delete(bookings).where(eq(bookings.classId, classId));
      };
      
      // Helper function to delete class schedules for a class
      const deleteSchedulesForClass = async (classId: number) => {
        console.log(`Deleting schedules for class ${classId}`);
        await db.delete(classSchedules).where(eq(classSchedules.classId, classId));
      };
      
      // If this is a parent class (recurring series)
      if (classItem.isRecurring) {
        // Get all child classes in the series
        const childClasses = await this.getClassesByParentId(id);
        console.log(`Found ${childClasses.length} child classes for series ${id}`);
        
        // Delete bookings and schedules for all child classes
        for (const childClass of childClasses) {
          await deleteBookingsForClass(childClass.id);
          await deleteSchedulesForClass(childClass.id);
        }
        
        // Delete all child classes in the series
        console.log(`Deleting child classes for series ${id}`);
        await db.delete(classes).where(eq(classes.parentClassId, id));
        
        // Delete bookings and schedules for the parent class
        await deleteBookingsForClass(id);
        await deleteSchedulesForClass(id);
        
        // Then delete the parent class itself
        console.log(`Deleting parent class ${id}`);
        await db.delete(classes).where(eq(classes.id, id));
      } 
      // If this is a child class in a series
      else if (classItem.parentClassId) {
        // Find the parent class
        const parentClass = await this.getClass(classItem.parentClassId);
        
        if (parentClass?.isRecurring) {
          // If we're deleting the whole series
          if (id === parentClass.id) {
            console.log(`Deleting entire series. Parent: ${parentClass.id}`);
            
            // Get all child classes
            const childClasses = await this.getClassesByParentId(parentClass.id);
            
            // Delete bookings and schedules for all child classes
            for (const childClass of childClasses) {
              await deleteBookingsForClass(childClass.id);
              await deleteSchedulesForClass(childClass.id);
            }
            
            // Delete all child classes
            await db.delete(classes).where(eq(classes.parentClassId, parentClass.id));
            
            // Delete bookings and schedules for parent
            await deleteBookingsForClass(parentClass.id);
            await deleteSchedulesForClass(parentClass.id);
            
            // Delete the parent class
            await db.delete(classes).where(eq(classes.id, parentClass.id));
          } else {
            // Just delete this single instance
            console.log(`Deleting single instance ${id} from series ${parentClass.id}`);
            await deleteBookingsForClass(id);
            await deleteSchedulesForClass(id);
            await db.delete(classes).where(eq(classes.id, id));
          }
        } else {
          // Just delete this instance (parent might be gone already)
          console.log(`Deleting instance ${id}`);
          await deleteBookingsForClass(id);
          await deleteSchedulesForClass(id);
          await db.delete(classes).where(eq(classes.id, id));
        }
      } 
      // This is a standalone class
      else {
        console.log(`Deleting standalone class ${id}`);
        await deleteBookingsForClass(id);
        await deleteSchedulesForClass(id);
        await db.delete(classes).where(eq(classes.id, id));
      }
      
      console.log(`Successfully deleted class ${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting class:", error);
      return false;
    }
  }

  // Delete recurring class series by series ID
  async deleteRecurringClassSeries(seriesId: string): Promise<boolean> {
    try {
      console.log(`Deleting recurring class series: ${seriesId}`);
      
      // Find all classes in this series
      const seriesClasses = await db.select().from(classes).where(eq(classes.recurringSeriesId, seriesId));
      console.log(`Found ${seriesClasses.length} classes in series to delete`);
      
      // Delete all classes in the series
      for (const classInstance of seriesClasses) {
        await this.deleteClass(classInstance.id);
      }
      
      console.log(`Successfully deleted recurring class series: ${seriesId}`);
      return true;
    } catch (error) {
      console.error("Error deleting recurring class series:", error);
      return false;
    }
  }

  // Get all classes in a recurring series
  async getClassesBySeriesId(seriesId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.recurringSeriesId, seriesId));
  }

  // Delete this and following classes in a recurring series
  async deleteThisAndFollowingClasses(classId: number): Promise<boolean> {
    try {
      console.log(`Deleting this and following classes starting from: ${classId}`);
      
      // Get the class to find its series and start time
      const targetClass = await this.getClass(classId);
      if (!targetClass || !targetClass.recurringSeriesId || !targetClass.startTime) {
        throw new Error("Class not found or not part of a recurring series");
      }
      
      // Get all classes in the series that start at or after this class
      const seriesToDelete = await db.select().from(classes)
        .where(and(
          eq(classes.recurringSeriesId, targetClass.recurringSeriesId),
          sql`${classes.startTime} >= ${targetClass.startTime}`
        ));
      
      console.log(`Found ${seriesToDelete.length} classes to delete (this and following)`);
      
      // Delete all matching classes
      for (const classInstance of seriesToDelete) {
        await this.deleteClass(classInstance.id);
      }
      
      console.log(`Successfully deleted this and following classes`);
      return true;
    } catch (error) {
      console.error("Error deleting this and following classes:", error);
      return false;
    }
  }
  
  // Booking methods
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings)
      .values({
        ...bookingData,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }
  
  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }
  
  async getClassBookings(classId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.classId, classId));
  }
  
  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set(bookingData)
      .where(eq(bookings.id, id))
      .returning();
    
    return result[0];
  }
  
  // Review methods
  async createReview(reviewData: InsertReview): Promise<Review> {
    const result = await db.insert(reviews)
      .values({
        ...reviewData,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getClassReviews(classId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.classId, classId));
  }
  
  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }
  
  // Stripe
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const result = await db.update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return result[0];
  }
  
  // Password reset methods
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const result = await db.insert(passwordResetTokens)
      .values({
        ...tokenData,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const result = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        sql`${passwordResetTokens.usedAt} IS NULL`,
        sql`${passwordResetTokens.expiresAt} > NOW()`
      ));
    
    return result[0];
  }
  
  async markPasswordResetTokenAsUsed(token: string): Promise<boolean> {
    const result = await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token))
      .returning();
    
    return result.length > 0;
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async createContactMessage(messageData: InsertContactMessage): Promise<ContactMessage> {
    const result = await db.insert(contactMessages)
      .values({
        ...messageData,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }
  
  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async getAllCustomerBookings() {
    // Use raw SQL query for better control over joins and aliases
    const bookingsWithDetails = await db.execute(sql`
      SELECT 
        b.id,
        c.title as "className",
        c.start_time as "classDate",
        c.start_time as "startTime", 
        coach.first_name || ' ' || coach.last_name as "coachName",
        customer.first_name || ' ' || customer.last_name as "customerName",
        customer.email as "customerEmail",
        customer.phone as "customerPhone",
        b.user_id as "customerId",
        b.quantity as "spots",
        b.status
      FROM bookings b
      INNER JOIN classes c ON b.class_id = c.id
      INNER JOIN users coach ON c.coach_id = coach.id  
      INNER JOIN users customer ON b.user_id = customer.id
      WHERE b.status = 'confirmed'
      ORDER BY c.start_time DESC
    `);

    // Get completed classes count for each customer
    const completedClassCounts = await db.execute(sql`
      SELECT 
        b.user_id as "customerId",
        COUNT(*) as "completedCount"
      FROM bookings b
      INNER JOIN classes c ON b.class_id = c.id  
      WHERE b.status = 'confirmed' 
        AND c.start_time < NOW()
      GROUP BY b.user_id
    `);

    // Create a map for quick lookup of completed counts
    const completedCountMap = new Map(
      completedClassCounts.rows.map((item: any) => [item.customerId, Number(item.completedCount)])
    );

    // Add completed classes count to each booking
    const bookingsWithCounts = bookingsWithDetails.rows.map((booking: any) => ({
      ...booking,
      completedClassesCount: completedCountMap.get(booking.customerId) || 0,
    }));

    return bookingsWithCounts;
  }

  async getCustomersForCoach(coachId: number, userRole: string): Promise<any[]> {
    try {
      // For admins, show all customer bookings; for coaches, only their own classes
      const query = db
        .select({
          id: bookings.id,
          classDate: classes.startTime,
          classTime: classes.startTime,
          className: classes.title,
          customerFirstName: users.firstName,
          customerLastName: users.lastName,
          customerPhone: users.phone,
          customerEmail: users.email,
          quantity: bookings.quantity,
          status: bookings.status,
          coachId: classes.coachId,
          completedClasses: sql<number>`COALESCE((
            SELECT COUNT(*)::int 
            FROM ${bookings} b2 
            INNER JOIN ${classes} c2 ON b2.class_id = c2.id 
            WHERE b2.user_id = ${users.id} 
            AND c2.start_time < NOW() 
            AND b2.status = 'confirmed'
          ), 0)`
        })
        .from(bookings)
        .innerJoin(classes, eq(bookings.classId, classes.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(
          userRole === 'admin' 
            ? eq(bookings.status, 'confirmed')
            : and(
                eq(bookings.status, 'confirmed'),
                eq(classes.coachId, coachId)
              )
        )
        .orderBy(
          classes.startTime, // Class date first
          classes.startTime, // Class time second (same field for date/time)
          classes.title,     // Class name third
          users.firstName,   // Customer first name fourth
          users.lastName     // Customer last name fifth
        );

      const results = await query;
      
      // For admin users, add coach information by fetching coach details
      if (userRole === 'admin' && results.length > 0) {
        const coachIdsSet = new Set<number>();
        results.forEach(r => coachIdsSet.add(r.coachId));
        const coachIds = Array.from(coachIdsSet);
        
        const coaches = await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName
        }).from(users).where(inArray(users.id, coachIds));
        
        const coachMap = new Map(coaches.map(coach => [coach.id, coach]));
        
        return results.map(result => ({
          ...result,
          coachFirstName: coachMap.get(result.coachId)?.firstName || '',
          coachLastName: coachMap.get(result.coachId)?.lastName || ''
        }));
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching customers for coach:', error);
      return [];
    }
  }
  
  async getReviewByClassAndBooking(classId: number, bookingId: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.classId, classId), eq(reviews.bookingId, bookingId)));
    return review || undefined;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const result = await db.update(reviews)
      .set({
        ...reviewData,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, id))
      .returning();
    
    return result[0];
  }

  async getClassRatingStats(classId: number): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await db.select({
      averageRating: sql<number>`AVG(${reviews.rating})::float`,
      totalReviews: sql<number>`COUNT(*)::int`
    })
    .from(reviews)
    .where(eq(reviews.classId, classId));
    
    const stats = result[0];
    return {
      averageRating: stats?.averageRating || 0,
      totalReviews: stats?.totalReviews || 0
    };
  }

  async getCoachRatingStats(coachId: number): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await db.select({
      averageRating: sql<number>`AVG(${reviews.rating})::float`,
      totalReviews: sql<number>`COUNT(*)::int`
    })
    .from(reviews)
    .where(eq(reviews.coachId, coachId));
    
    const stats = result[0];
    return {
      averageRating: stats?.averageRating || 0,
      totalReviews: stats?.totalReviews || 0
    };
  }

  async getCoachReviews(coachId: number): Promise<any[]> {
    const result = await db.select({
      id: reviews.id,
      userId: reviews.userId,
      classId: reviews.classId,
      bookingId: reviews.bookingId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      className: classes.title
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(classes, eq(reviews.classId, classes.id))
    .where(eq(reviews.coachId, coachId))
    .orderBy(desc(reviews.updatedAt))
    .limit(5);
    
    return result;
  }

  // Blog post methods
  async createBlogPost(postData: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(postData).returning();
    return post;
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPosts(filters?: { status?: string }): Promise<BlogPost[]> {
    const query = db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
    
    if (filters?.status) {
      return await query.where(eq(blogPosts.status, filters.status));
    }
    
    return await query;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async updateBlogPost(id: number, postData: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost || undefined;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result.rowCount > 0;
  }

  // Scheduled Payout methods
  async createScheduledPayout(payoutData: InsertScheduledPayout): Promise<ScheduledPayout> {
    const [payout] = await db.insert(scheduledPayouts).values(payoutData).returning();
    return payout;
  }

  async getScheduledPayouts(filters?: { status?: string }): Promise<ScheduledPayout[]> {
    const query = db.select().from(scheduledPayouts).orderBy(desc(scheduledPayouts.createdAt));
    
    if (filters?.status) {
      return await query.where(eq(scheduledPayouts.status, filters.status));
    }
    
    return await query;
  }

  async getScheduledPayoutsByClass(classId: number): Promise<ScheduledPayout[]> {
    return await db.select()
      .from(scheduledPayouts)
      .where(eq(scheduledPayouts.classId, classId))
      .orderBy(desc(scheduledPayouts.createdAt));
  }

  async getScheduledPayoutsByCoach(coachId: number): Promise<ScheduledPayout[]> {
    return await db.select()
      .from(scheduledPayouts)
      .where(eq(scheduledPayouts.coachId, coachId))
      .orderBy(desc(scheduledPayouts.createdAt));
  }

  async updateScheduledPayout(id: number, payoutData: Partial<ScheduledPayout>): Promise<ScheduledPayout | undefined> {
    const [updatedPayout] = await db
      .update(scheduledPayouts)
      .set({ ...payoutData, updatedAt: new Date() })
      .where(eq(scheduledPayouts.id, id))
      .returning();
    return updatedPayout || undefined;
  }

  async getDueScheduledPayouts(): Promise<ScheduledPayout[]> {
    return await db.select()
      .from(scheduledPayouts)
      .where(and(
        eq(scheduledPayouts.status, 'scheduled'),
        sql`${scheduledPayouts.scheduledPayoutDate} <= NOW()`
      ))
      .orderBy(scheduledPayouts.scheduledPayoutDate);
  }
}

export const storage = new DatabaseStorage();
