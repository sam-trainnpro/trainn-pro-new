import { 
  users, type User, type InsertUser, 
  classes, type Class, type InsertClass, 
  bookings, type Booking, type InsertBooking, 
  reviews, type Review, type InsertReview, 
  classCategories, type ClassCategory, type InsertClassCategory,
  classSchedules, type ClassSchedule, type InsertClassSchedule, type ClassWithSchedules,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken,
  contactMessages, type ContactMessage, type InsertContactMessage
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";

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
  getClassCategory(id: number): Promise<ClassCategory | undefined>;
  
  // Classes
  createClass(classData: InsertClass): Promise<Class>;
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
  deleteClass(id: number): Promise<boolean>;
  
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
  
  async getClassCategory(id: number): Promise<ClassCategory | undefined> {
    const result = await db.select().from(classCategories).where(eq(classCategories.id, id));
    return result[0];
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
        // Handle date fields - they might be optional now for recurring classes
        startTime: classData.startTime ? new Date(classData.startTime) : undefined,
        endTime: classData.endTime ? new Date(classData.endTime) : undefined,
        // Add created timestamp
        createdAt: new Date()
      };
      
      console.log("Formatted class data:", formattedData);
      
      const result = await db.insert(classes)
        .values(formattedData)
        .returning();
      
      console.log("Class created successfully:", result[0]);
      
      return result[0];
    } catch (error) {
      console.error("Error in storage.createClass:", error);
      throw error; // Re-throw to handle in routes
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
    return await db.select().from(classes).where(eq(classes.coachId, coachId));
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
  
  async updateClassSeries(parentClassId: number, classData: Partial<Class>): Promise<Class[]> {
    // First, update the parent class itself
    await db.update(classes)
      .set(classData)
      .where(eq(classes.id, parentClassId));
    
    // Then update all child classes (instances) of this series
    // We exclude date-specific fields from the update
    const { startTime, endTime, ...updateData } = classData;
    
    // Get all child classes
    const childClasses = await this.getClassesByParentId(parentClassId);
    
    // Update each child class individually to ensure proper returning
    const updatedClasses: Class[] = [];
    for (const childClass of childClasses) {
      const result = await db.update(classes)
        .set(updateData)
        .where(eq(classes.id, childClass.id))
        .returning();
      
      if (result.length > 0) {
        updatedClasses.push(result[0]);
      }
    }
    
    // Return the updated parent class along with all updated child classes
    const parentClass = await this.getClass(parentClassId);
    if (parentClass) {
      updatedClasses.unshift(parentClass);
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
    .innerJoin(classes, eq(reviews.classId, classes.id))
    .where(eq(classes.coachId, coachId));
    
    const stats = result[0];
    return {
      averageRating: stats?.averageRating || 0,
      totalReviews: stats?.totalReviews || 0
    };
  }
}

export const storage = new DatabaseStorage();
