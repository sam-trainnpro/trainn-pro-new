import { users, type User, type InsertUser, classes, type Class, type InsertClass, bookings, type Booking, type InsertBooking, reviews, type Review, type InsertReview, classCategories, type ClassCategory, type InsertClassCategory } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

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
  getClasses(): Promise<Class[]>;
  getUserClasses(userId: number): Promise<Class[]>;
  getClassesByCategory(categoryId: number): Promise<Class[]>;
  getClassesByCoach(coachId: number): Promise<Class[]>;
  updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  
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
  
  // Stripe
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
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
        // Ensure date fields are Date objects
        startTime: new Date(classData.startTime),
        endTime: new Date(classData.endTime),
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
  
  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.id, id));
    return result[0];
  }
  
  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes).orderBy(desc(classes.createdAt));
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
    const result = await db.update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteClass(id: number): Promise<boolean> {
    try {
      await db.delete(classes).where(eq(classes.id, id));
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
}

export const storage = new DatabaseStorage();
