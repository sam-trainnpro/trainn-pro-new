import { 
  users, type User, type InsertUser, 
  classes, type Class, type InsertClass, 
  bookings, type Booking, type InsertBooking, 
  reviews, type Review, type InsertReview, 
  classCategories, type ClassCategory, type InsertClassCategory,
  classSchedules, type ClassSchedule, type InsertClassSchedule, type ClassWithSchedules, type ClassCardDTO,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken,
  contactMessages, type ContactMessage, type InsertContactMessage,
  blogPosts, type BlogPost, type InsertBlogPost,
  scheduledPayouts, type ScheduledPayout, type InsertScheduledPayout,
  promoCodes, type PromoCode, type InsertPromoCode,
  promoCodeUsage, type PromoCodeUsage, type InsertPromoCodeUsage,
  bookingSubsidies, type BookingSubsidy, type InsertBookingSubsidy,
  userCommissionTiers, type UserCommissionTier, type InsertUserCommissionTier,
  referrals, type Referral, type InsertReferral,
  userCredits, type UserCredit, type InsertUserCredit,
  providerReferrals, type ProviderReferral, type InsertProviderReferral,
  classPackages, type ClassPackage, type InsertClassPackage,
  packagePurchases, type PackagePurchase, type InsertPackagePurchase,
  packageBookings, type PackageBooking, type InsertPackageBooking,
  emailReminderTracking, type EmailReminderTracking, type InsertEmailReminderTracking
} from "@shared/schema";
import { generateRecurringInstances, parseRecurrenceRule } from "./recurrence-utils";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, or, desc, inArray, sql, lt, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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
  getClassesWithAllData(filters?: {
    categoryId?: number;
    ageGroup?: string;
    city?: string;
    outdoors?: boolean;
    coachId?: number;
    searchQuery?: string;
    dateFilter?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ClassCardDTO[]>;
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
  
  // SEO Landing Pages
  getOutdoorWorkoutClassesSF(): Promise<Array<Class & { coach: User; category: ClassCategory }>>;
  getKidsDropInSportsClassesSF(): Promise<Array<Class & { coach: User; category: ClassCategory }>>;
  getOutdoorYogaClassesSF(): Promise<Array<Class & { coach: User; category: ClassCategory }>>;
  getKidsDropInActivitiesSF(): Promise<Array<Class & { coach: User; category: ClassCategory }>>;
  getPersonalTrainersClassesSF(): Promise<Array<Class & { coach: User; category: ClassCategory }>>;
  
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
  
  // Referral system
  generateReferralCode(firstName: string, lastName: string, userId: number): string;
  createReferral(referralData: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerId: number): Promise<Referral[]>;
  updateReferral(id: number, referralData: Partial<Referral>): Promise<Referral | undefined>;
  
  // User credits
  getUserCreditBalance(userId: number): Promise<number>;
  addUserCredit(creditData: InsertUserCredit): Promise<UserCredit>;
  getUserCreditHistory(userId: number): Promise<UserCredit[]>;
  getUserCredits(userId: number): Promise<UserCredit[]>;
  applyCreditsToBooking(userId: number, amount: number, bookingId: number): Promise<UserCredit>;
  refundCreditsForBooking(userId: number, amount: number, bookingId: number, reason: string): Promise<UserCredit>;
  getCreditsUsedForBooking(bookingId: number): Promise<number>;
  hasExistingRefundForBooking(bookingId: number): Promise<boolean>;
  
  // Referral processing
  processReferralSignup(referralCode: string, refereeId: number): Promise<Referral | undefined>;
  processReferralCompletion(refereeId: number): Promise<void>;
  getReferralStatusForUser(userId: number): Promise<{ status: string; referrerName: string; completedAt: Date | null } | null>;
  getUserReferralStatus(userId: number): Promise<{ status: string; isReferral: boolean } | null>;
  
  // Referrer reward processing
  processReferrerRewards(): Promise<void>;
  checkAndAwardReferrerRewards(referrerId: number): Promise<number>;
  
  // Platform subsidies
  createBookingSubsidy(subsidyData: InsertBookingSubsidy): Promise<BookingSubsidy>;
  getPlatformSubsidyForBooking(bookingId: number): Promise<number>;
  
  // Provider Referral system
  createProviderReferral(referralData: InsertProviderReferral): Promise<ProviderReferral>;
  getProviderReferralByCode(code: string): Promise<ProviderReferral | undefined>;
  getProviderReferralsByReferrer(referrerId: number): Promise<ProviderReferral[]>;
  updateProviderReferral(id: number, referralData: Partial<ProviderReferral>): Promise<ProviderReferral | undefined>;
  processProviderReferralSignup(referralCode: string, providerId: number): Promise<ProviderReferral | undefined>;
  updateProviderReferralBookingCount(providerId: number): Promise<void>;
  processProviderReferralRewards(): Promise<void>;
  
  // Provider-to-Customer Referral Stripe Transfer
  createProviderReferralStripeTransfer(providerId: number, referralId: number, amount: number): Promise<void>;
  
  // Class Package methods
  createPackage(packageData: InsertClassPackage): Promise<ClassPackage>;
  getPackage(id: number): Promise<ClassPackage | undefined>;
  getCoachPackages(coachId: number): Promise<ClassPackage[]>;
  getAllPackages(): Promise<ClassPackage[]>;
  updatePackage(id: number, packageData: Partial<ClassPackage>): Promise<ClassPackage | undefined>;
  deletePackage(id: number): Promise<boolean>;
  checkPackageHasBookings(packageId: number): Promise<boolean>;

  // Package Purchase methods
  createPackagePurchase(purchaseData: InsertPackagePurchase): Promise<PackagePurchase>;
  getPackagePurchase(id: number): Promise<PackagePurchase | undefined>;
  getUserPackagePurchases(userId: number): Promise<PackagePurchase[]>;
  updatePackagePurchase(id: number, purchaseData: Partial<PackagePurchase>): Promise<PackagePurchase | undefined>;

  // Package Booking methods
  createPackageBooking(bookingData: InsertPackageBooking): Promise<PackageBooking>;
  getPackageBooking(id: number): Promise<PackageBooking | undefined>;
  getPackageBookingByBookingId(bookingId: number): Promise<PackageBooking | undefined>;
  getUserPackageBookings(userId: number): Promise<PackageBooking[]>;
  getPackageBookingsByPackagePurchase(packagePurchaseId: number): Promise<PackageBooking[]>;
  updatePackageBooking(id: number, bookingData: Partial<PackageBooking>): Promise<PackageBooking | undefined>;

  // Email Reminder Tracking methods
  getEmailReminderTracking(processType: string): Promise<EmailReminderTracking | undefined>;
  upsertEmailReminderTracking(processType: string, lastProcessedDate: string): Promise<EmailReminderTracking>;
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

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return result[0];
  }

  async getUserByProviderReferralCode(providerReferralCode: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.providerReferralCode, providerReferralCode));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...userData,
      createdAt: new Date(),
      isApproved: userData.role === 'customer' || userData.role === 'admin'
    }).returning();
    
    const user = result[0];
    
    // Generate referral code for new user
    if (!user.referralCode) {
      const referralCode = this.generateReferralCode(user.firstName, user.lastName, user.id);
      const updatedUser = await this.updateUser(user.id, { referralCode });
      return updatedUser || user;
    }
    
    return user;
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
        SELECT DISTINCT city
        FROM classes 
        WHERE city IS NOT NULL 
          AND city != '' 
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

  async getClassesWithAllData(filters?: {
    categoryId?: number;
    ageGroup?: string;
    city?: string;
    outdoors?: boolean;
    coachId?: number;
    searchQuery?: string;
    dateFilter?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ClassCardDTO[]> {
    try {
      // Build WHERE conditions based on filters
      const whereConditions = [
        // Always filter to future classes only
        or(
          sql`${classes.startTime} >= NOW()`,
          sql`${classes.startTime} IS NULL AND ${classes.isRecurring} = true`
        )
      ];

      if (filters?.categoryId) {
        whereConditions.push(eq(classes.categoryId, filters.categoryId));
      }

      if (filters?.ageGroup) {
        whereConditions.push(eq(classes.ageGroup, filters.ageGroup));
      }

      if (filters?.city) {
        whereConditions.push(sql`LOWER(${classes.city}) LIKE LOWER(${'%' + filters.city + '%'})`);
      }

      if (filters?.outdoors !== undefined) {
        whereConditions.push(eq(classes.outdoors, filters.outdoors));
      }

      if (filters?.coachId) {
        whereConditions.push(eq(classes.coachId, filters.coachId));
      }

      if (filters?.searchQuery) {
        whereConditions.push(
          or(
            sql`LOWER(${classes.title}) LIKE LOWER(${'%' + filters.searchQuery + '%'})`,
            sql`LOWER(${classes.description}) LIKE LOWER(${'%' + filters.searchQuery + '%'})`
          )
        );
      }

      if (filters?.dateFilter) {
        const filterDate = new Date(filters.dateFilter);
        filterDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        whereConditions.push(
          and(
            sql`${classes.startTime} >= ${filterDate.toISOString()}::timestamp`,
            sql`${classes.startTime} < ${nextDay.toISOString()}::timestamp`
          )
        );
      }

      // Single query that joins all necessary tables to eliminate N+1 queries
      let query = db
        .select({
          // Class fields
          id: classes.id,
          title: classes.title,
          description: classes.description,
          price: classes.price,
          capacity: classes.capacity,
          location: classes.location,
          latitude: classes.latitude,
          longitude: classes.longitude,
          address: classes.address,
          city: classes.city,
          image: classes.image,
          startTime: classes.startTime,
          endTime: classes.endTime,
          isRecurring: classes.isRecurring,
          recurringSeriesId: classes.recurringSeriesId,
          ageGroup: classes.ageGroup,
          outdoors: classes.outdoors,
          createdAt: classes.createdAt,
          // Coach fields
          coachId: classes.coachId,
          coachFirstName: users.firstName,
          coachLastName: users.lastName,
          coachBusinessName: users.businessName,
          coachDisplayBusinessName: users.displayBusinessName,
          coachProfileImage: users.profileImage,
          coachGoogleProfilePicture: users.googleProfilePicture,
          // Category fields
          categoryId: classes.categoryId,
          categoryName: classCategories.name,
          categoryImage: classCategories.image,
          // Booking statistics
          totalBookings: sql<number>`COALESCE(booking_stats.total_bookings, 0)`,
          activeBookings: sql<number>`COALESCE(booking_stats.active_bookings, 0)`,
          // Rating statistics
          averageRating: sql<number>`COALESCE(rating_stats.average_rating, 0)`,
          totalReviews: sql<number>`COALESCE(rating_stats.total_reviews, 0)`,
          // Next schedule for recurring classes
          nextScheduleStart: sql<Date | null>`next_schedule.start_time`,
          nextScheduleEnd: sql<Date | null>`next_schedule.end_time`,
        })
        .from(classes)
        .leftJoin(users, eq(classes.coachId, users.id))
        .leftJoin(classCategories, eq(classes.categoryId, classCategories.id))
        // Subquery for booking statistics
        .leftJoin(
          sql`(
            SELECT 
              class_id,
              COUNT(*) as total_bookings,
              COALESCE(SUM(quantity) FILTER (WHERE status IN ('confirmed', 'pending')), 0) as active_bookings
            FROM ${bookings}
            GROUP BY class_id
          ) booking_stats`,
          sql`booking_stats.class_id = ${classes.id}`
        )
        // Subquery for rating statistics per coach
        .leftJoin(
          sql`(
            SELECT 
              coach_id,
              AVG(rating::numeric) as average_rating,
              COUNT(*) as total_reviews
            FROM ${reviews}
            GROUP BY coach_id
          ) rating_stats`,
          sql`rating_stats.coach_id = ${classes.coachId}`
        )
        // Subquery for next schedule (for recurring classes)
        .leftJoin(
          sql`LATERAL (
            SELECT start_time, end_time
            FROM ${classSchedules} cs
            WHERE cs.class_id = ${classes.id}
            AND (date_trunc('day', NOW()) + cs.start_time::time) >= NOW()
            ORDER BY cs.start_time ASC
            LIMIT 1
          ) next_schedule`,
          sql`true`
        )
        .where(and(...whereConditions))
        .orderBy(
          sql`CASE 
              WHEN ${classes.startTime} IS NOT NULL THEN 0
              ELSE 1
             END`,
          sql`CASE 
              WHEN ${classes.startTime} IS NOT NULL THEN ${classes.startTime}
              ELSE ${classes.createdAt}
             END`
        );

      // Apply pagination if provided
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      const result = await query;

      // Transform the results into ClassCardDTO format
      return result.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        capacity: row.capacity,
        location: row.location,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
        city: row.city,
        image: row.image,
        startTime: row.startTime,
        endTime: row.endTime,
        isRecurring: row.isRecurring || false,
        recurringSeriesId: row.recurringSeriesId,
        ageGroup: row.ageGroup,
        outdoors: row.outdoors ?? false,
        createdAt: row.createdAt,
        coach: {
          id: row.coachId,
          firstName: row.coachFirstName,
          lastName: row.coachLastName,
          businessName: row.coachBusinessName,
          displayBusinessName: row.coachDisplayBusinessName,
          profileImage: row.coachProfileImage,
          googleProfilePicture: row.coachGoogleProfilePicture,
        },
        category: {
          id: row.categoryId,
          name: row.categoryName,
          image: row.categoryImage,
        },
        nextSchedule: row.nextScheduleStart && row.nextScheduleEnd ? {
          startTime: row.nextScheduleStart,
          endTime: row.nextScheduleEnd,
        } : null,
        bookingStats: {
          totalBookings: row.totalBookings,
          activeBookings: row.activeBookings,
          spotsLeft: Math.max(0, row.capacity - row.activeBookings),
        },
        ratingStats: {
          averageRating: row.averageRating,
          totalReviews: row.totalReviews,
        },
      }));
    } catch (error) {
      console.error("Error getting classes with all data:", error);
      throw error;
    }
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
    // Only return active classes with valid start times (exclude parent recurring templates and cancelled classes)
    return await db.select().from(classes)
      .where(and(
        eq(classes.coachId, coachId),
        sql`${classes.startTime} IS NOT NULL`,
        ne(classes.status, 'cancelled')
      ));
  }
  
  async updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined> {
    try {
      console.log("Updating class with ID:", id);
      console.log("Class data to update:", classData);
      
      // CRITICAL: Block direct status='cancelled' updates - must go through deleteClass
      if (classData.status === 'cancelled') {
        throw new Error("Cannot set status to 'cancelled' directly. Use deleteClass() method to properly handle booking cancellations and package restoration.");
      }
      
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
        (instanceUpdateData as any).endTime = newEndTime;
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
      
      console.log(`🗑️ [DELETION START] Class ID: ${id}, Title: "${classItem.title}", isRecurring: ${classItem.isRecurring}, parentClassId: ${classItem.parentClassId}, Status: ${classItem.status}`);
      
      // Helper function to cancel bookings for a class (soft delete approach)
      const cancelBookingsForClass = async (classId: number) => {
        console.log(`Cancelling bookings for class ${classId}`);
        
        // First, get all active bookings for this class to process package restoration
        const classBookings = await db.select().from(bookings).where(
          and(eq(bookings.classId, classId), eq(bookings.status, 'confirmed'))
        );
        
        // Process package restoration for each booking before cancellation
        for (const booking of classBookings) {
          if (booking.paymentMethod === 'package') {
            try {
              // Find the package booking record
              const packageBooking = await this.getPackageBookingByBookingId(booking.id);
              
              if (packageBooking && packageBooking.status === 'confirmed') {
                // Update package booking status to cancelled
                await this.updatePackageBooking(packageBooking.id, { status: 'cancelled' });
                
                // Get the package purchase to restore class counts
                const packagePurchase = await this.getPackagePurchase(packageBooking.packagePurchaseId);
                
                if (packagePurchase) {
                  // Restore the package counts: increment remainingClasses and decrement usedClasses
                  await this.updatePackagePurchase(packagePurchase.id, {
                    usedClasses: packagePurchase.usedClasses - booking.quantity,
                    remainingClasses: packagePurchase.remainingClasses + booking.quantity
                  });
                  
                  console.log(`✅ [PACKAGE RESTORED] ${booking.quantity} class(es) restored to package ${packagePurchase.id} for booking ${booking.id} (provider cancellation). Package now: ${packagePurchase.usedClasses - booking.quantity}/${packagePurchase.usedClasses + packagePurchase.remainingClasses} used`);
                } else {
                  console.error(`⚠️ Package purchase not found for package booking ${packageBooking.id}`);
                }
              }
            } catch (packageError) {
              console.error(`Failed to restore package classes for booking ${booking.id}:`, packageError);
              // Continue with cancellation even if package restoration fails
            }
          }
          
          // Actually delete the booking since provider wants hard delete
          await db.delete(bookings).where(eq(bookings.id, booking.id));
        }
      };
      
      // Helper function to soft delete class schedules for a class (mark as inactive)
      const cancelSchedulesForClass = async (classId: number) => {
        console.log(`Cancelling schedules for class ${classId}`);
        // For schedules, we can still delete them since they're just configuration
        // and not user data like bookings. Alternatively, we could add a status to schedules too.
        await db.delete(classSchedules).where(eq(classSchedules.classId, classId));
      };
      
      // If this is a parent class (recurring series)
      if (classItem.isRecurring) {
        // Get all child classes in the series
        const childClasses = await this.getClassesByParentId(id);
        console.log(`Found ${childClasses.length} child classes for series ${id}`);
        
        // Cancel bookings and schedules for all child classes
        for (const childClass of childClasses) {
          await cancelBookingsForClass(childClass.id);
          await cancelSchedulesForClass(childClass.id);
        }
        
        // Delete all child classes in the series
        console.log(`Deleting child classes for series ${id}`);
        await db.delete(classes).where(eq(classes.parentClassId, id));
        
        // Cancel bookings and schedules for the parent class
        await cancelBookingsForClass(id);
        await cancelSchedulesForClass(id);
        
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
            
            // Cancel bookings and schedules for all child classes
            for (const childClass of childClasses) {
              await cancelBookingsForClass(childClass.id);
              await cancelSchedulesForClass(childClass.id);
            }
            
            // Delete all child classes
            await db.delete(classes).where(eq(classes.parentClassId, parentClass.id));
            
            // Cancel bookings and schedules for parent
            await cancelBookingsForClass(parentClass.id);
            await cancelSchedulesForClass(parentClass.id);
            
            // Delete the parent class
            await db.delete(classes).where(eq(classes.id, parentClass.id));
          } else {
            // Just delete this single instance
            console.log(`Deleting single instance ${id} from series ${parentClass.id}`);
            await cancelBookingsForClass(id);
            await cancelSchedulesForClass(id);
            await db.delete(classes).where(eq(classes.id, id));
          }
        } else {
          // Just delete this instance (parent might be gone already)
          console.log(`Deleting instance ${id}`);
          await cancelBookingsForClass(id);
          await cancelSchedulesForClass(id);
          await db.delete(classes).where(eq(classes.id, id));
        }
      } 
      // This is a standalone class
      else {
        console.log(`Deleting standalone class ${id}`);
        await cancelBookingsForClass(id);
        await cancelSchedulesForClass(id);
        await db.delete(classes).where(eq(classes.id, id));
      }
      
      console.log(`✅ [DELETION COMPLETE] Class ${id} successfully deleted. Package credits restored for affected customers.`);
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
          desc(classes.startTime), // Class date first (newest first)
          classes.title,           // Class name second
          users.firstName,        // Customer first name third
          users.lastName          // Customer last name fourth
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
    return (result.rowCount ?? 0) > 0;
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

  // Create Stripe transfer for provider-to-customer referral rewards
  async createProviderReferralStripeTransfer(providerId: number, referralId: number, amount: number): Promise<void> {
    console.log(`Creating provider referral Stripe transfer: Provider ${providerId}, Referral ${referralId}, Amount $${amount / 100}`);
    
    try {
      // Create scheduled payout for the provider referral reward
      const payoutData: InsertScheduledPayout = {
        bookingId: null, // No booking for referral rewards
        classId: null, // No class for referral rewards  
        coachId: providerId,
        customerId: null, // No customer for provider referral rewards
        stripePaymentIntentId: null, // No payment intent for referral rewards
        amountCents: amount,
        stripeFee: 0, // No stripe fee for transfers from platform
        netAmount: amount,
        coachPayout: amount, // Full amount goes to provider
        platformFee: 0, // Platform pays this as a reward
        payoutType: 'customer_referral_reward', // New payout type for provider-to-customer referrals
        providerReferralId: null, // This is for customer-to-customer referrals via provider
        scheduledPayoutDate: new Date(), // Pay immediately
        status: 'scheduled'
      };

      await this.createScheduledPayout(payoutData);
      console.log(`✅ Created scheduled payout for provider referral reward: $${amount / 100} to provider ${providerId}`);
      
    } catch (error) {
      console.error(`❌ Error creating provider referral Stripe transfer:`, error);
      throw error;
    }
  }

  // Class Package Management Methods
  async createPackage(packageData: InsertClassPackage): Promise<ClassPackage> {
    const [pkg] = await db.insert(classPackages).values(packageData).returning();
    return pkg;
  }

  async getPackage(id: number): Promise<ClassPackage | undefined> {
    const result = await db.select()
      .from(classPackages)
      .leftJoin(users, eq(classPackages.coachId, users.id))
      .leftJoin(classCategories, eq(classPackages.categoryId, classCategories.id))
      .where(eq(classPackages.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return undefined;
    }
    
    const row = result[0];
    return {
      ...row.class_packages,
      coachName: `${row.users?.firstName} ${row.users?.lastName}`,
      coachBusinessName: row.users?.businessName,
      displayBusinessName: row.users?.displayBusinessName,
      categoryName: row.class_categories?.name
    } as ClassPackage;
  }

  async getCoachPackages(coachId: number): Promise<ClassPackage[]> {
    return await db.select()
      .from(classPackages)
      .where(eq(classPackages.coachId, coachId))
      .orderBy(desc(classPackages.createdAt));
  }

  async getAllPackages(): Promise<ClassPackage[]> {
    return await db.select()
      .from(classPackages)
      .leftJoin(users, eq(classPackages.coachId, users.id))
      .leftJoin(classCategories, eq(classPackages.categoryId, classCategories.id))
      .where(and(
        eq(classPackages.isActive, true),
        eq(users.isApproved, true),
        eq(users.role, 'coach')
      ))
      .orderBy(desc(classPackages.createdAt))
      .then(results => 
        results.map(row => ({
          ...row.class_packages,
          coachName: `${row.users?.firstName} ${row.users?.lastName}`,
          coachBusinessName: row.users?.businessName,
          displayBusinessName: row.users?.displayBusinessName,
          coachProfileImage: row.users?.profileImage,
          categoryName: row.class_categories?.name
        }))
      );
  }

  async updatePackage(id: number, packageData: Partial<ClassPackage>): Promise<ClassPackage | undefined> {
    const [updatedPackage] = await db
      .update(classPackages)
      .set(packageData)
      .where(eq(classPackages.id, id))
      .returning();
    return updatedPackage || undefined;
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await db.delete(classPackages).where(eq(classPackages.id, id));
    return result.rowCount > 0;
  }

  async checkPackageHasBookings(packageId: number): Promise<boolean> {
    try {
      // Check if there are any package purchases for this package
      const purchases = await db.select()
        .from(packagePurchases)
        .where(eq(packagePurchases.packageId, packageId))
        .limit(1);
      
      if (purchases.length > 0) {
        return true;
      }
      
      // Check if there are any bookings directly associated with this package
      const bookings = await db.select()
        .from(packageBookings)
        .innerJoin(packagePurchases, eq(packageBookings.packagePurchaseId, packagePurchases.id))
        .where(eq(packagePurchases.packageId, packageId))
        .limit(1);
        
      return bookings.length > 0;
    } catch (error) {
      console.error("Error checking package bookings:", error);
      return false;
    }
  }

  // Promo Code Management Methods
  async createPromoCode(promoCodeData: InsertPromoCode): Promise<PromoCode> {
    const [promoCode] = await db.insert(promoCodes).values(promoCodeData).returning();
    return promoCode;
  }

  async getPromoCode(id: number): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    return promoCode || undefined;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select()
      .from(promoCodes)
      .where(and(
        eq(promoCodes.code, code.toUpperCase()),
        eq(promoCodes.isActive, true)
      ));
    return promoCode || undefined;
  }

  async getPromoCodeById(id: number): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id));
    return promoCode || undefined;
  }

  async getPromoCodes(filters?: { 
    coachId?: number; 
    isActive?: boolean; 
    requiresApproval?: boolean;
    isApproved?: boolean;
    createdBy?: number;
  }): Promise<PromoCode[]> {
    let query = db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));

    const conditions = [];
    if (filters?.coachId !== undefined) {
      conditions.push(eq(promoCodes.coachId, filters.coachId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(promoCodes.isActive, filters.isActive));
    }
    if (filters?.requiresApproval !== undefined) {
      conditions.push(eq(promoCodes.requiresApproval, filters.requiresApproval));
    }
    if (filters?.isApproved !== undefined) {
      conditions.push(eq(promoCodes.isApproved, filters.isApproved));
    }
    if (filters?.createdBy !== undefined) {
      conditions.push(eq(promoCodes.createdBy, filters.createdBy));
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  async updatePromoCode(id: number, promoCodeData: Partial<PromoCode>): Promise<PromoCode | undefined> {
    const [updatedPromoCode] = await db
      .update(promoCodes)
      .set({ ...promoCodeData, updatedAt: new Date() })
      .where(eq(promoCodes.id, id))
      .returning();
    return updatedPromoCode || undefined;
  }

  async deletePromoCode(id: number): Promise<boolean> {
    const result = await db.delete(promoCodes).where(eq(promoCodes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async approvePromoCode(id: number, approvedBy: number): Promise<PromoCode | undefined> {
    const [approvedPromoCode] = await db
      .update(promoCodes)
      .set({ 
        isApproved: true, 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(promoCodes.id, id))
      .returning();
    return approvedPromoCode || undefined;
  }

  async rejectPromoCode(id: number, rejectedBy: number): Promise<PromoCode | undefined> {
    const [rejectedPromoCode] = await db
      .update(promoCodes)
      .set({ 
        isApproved: false,
        isActive: false, // Deactivate rejected promo codes
        approvedBy: rejectedBy, // Track who rejected it
        approvedAt: new Date(), // Store rejection timestamp
        updatedAt: new Date() 
      })
      .where(eq(promoCodes.id, id))
      .returning();
    return rejectedPromoCode || undefined;
  }

  // Promo Code Validation and Application
  async validatePromoCode(code: string, userId: number, classId: number, quantity: number = 1): Promise<{
    valid: boolean;
    promoCode?: PromoCode;
    error?: string;
  }> {
    const promoCode = await this.getPromoCodeByCode(code);
    
    if (!promoCode) {
      return { valid: false, error: "Promo code not found" };
    }

    if (!promoCode.isActive) {
      return { valid: false, error: "Promo code is inactive" };
    }

    if (!promoCode.isApproved) {
      return { valid: false, error: "Promo code is pending approval" };
    }

    // Check minimum quantity requirement
    if (quantity < promoCode.minimumQuantity) {
      if (promoCode.minimumQuantity === 2) {
        return { valid: false, error: "This promo code requires at least 2 tickets" };
      } else {
        return { valid: false, error: `This promo code requires at least ${promoCode.minimumQuantity} tickets` };
      }
    }

    const now = new Date();
    if (now < new Date(promoCode.validFrom)) {
      return { valid: false, error: "Promo code is not yet valid" };
    }

    if (now > new Date(promoCode.validUntil)) {
      return { valid: false, error: "Promo code has expired" };
    }

    // Check usage limit
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return { valid: false, error: "Promo code usage limit reached" };
    }

    // Check if user has already used this promo code
    const existingUsage = await db.select()
      .from(promoCodeUsage)
      .where(and(
        eq(promoCodeUsage.promoCodeId, promoCode.id),
        eq(promoCodeUsage.userId, userId)
      ))
      .limit(1);

    if (existingUsage.length > 0) {
      return { valid: false, error: "You have already used this promo code" };
    }

    // Check first booking only restriction
    if (promoCode.firstBookingOnly) {
      const userBookings = await db.select()
        .from(bookings)
        .where(eq(bookings.userId, userId))
        .limit(1);

      if (userBookings.length > 0) {
        console.log(`Promo code ${code} validation failed: first booking only restriction for user ${userId} who has ${userBookings.length} existing bookings`);
        return { valid: false, error: "This promo code is only valid for new customers making their first booking" };
      }
    }

    // Check coach-specific restriction
    if (promoCode.coachId) {
      const classItem = await this.getClass(classId);
      if (!classItem || classItem.coachId !== promoCode.coachId) {
        return { valid: false, error: "This promo code is only valid for specific coach's classes" };
      }
    }

    // Check budget limit for subsidized codes
    if (promoCode.platformSubsidized && promoCode.budgetLimit) {
      if (promoCode.budgetUsed >= promoCode.budgetLimit) {
        return { valid: false, error: "Promo code budget limit reached" };
      }
    }

    return { valid: true, promoCode };
  }

  async calculateDiscount(promoCode: PromoCode, originalAmount: number): Promise<{
    discountAmount: number;
    finalAmount: number;
    subsidyAmount: number;
  }> {
    let discountAmount = 0;

    if (promoCode.discountType === 'percentage') {
      discountAmount = Math.round((originalAmount * promoCode.discountValue) / 100);
    } else if (promoCode.discountType === 'fixed') {
      discountAmount = Math.min(promoCode.discountValue, originalAmount);
    }

    console.log(`Discount calculation - Code: ${promoCode.code}, Type: ${promoCode.discountType}, Value: ${promoCode.discountValue}, Original: ${originalAmount}, Discount: ${discountAmount}`);

    const finalAmount = originalAmount - discountAmount;
    const subsidyAmount = promoCode.platformSubsidized ? discountAmount : 0;

    return { discountAmount, finalAmount, subsidyAmount };
  }

  async recordPromoCodeUsage(promoCodeUsageData: InsertPromoCodeUsage): Promise<PromoCodeUsage> {
    const [usage] = await db.insert(promoCodeUsage).values(promoCodeUsageData).returning();
    
    // Update promo code usage count and budget used
    await db
      .update(promoCodes)
      .set({
        usageCount: sql`${promoCodes.usageCount} + 1`,
        budgetUsed: sql`${promoCodes.budgetUsed} + ${promoCodeUsageData.subsidyAmount}`,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, promoCodeUsageData.promoCodeId));

    return usage;
  }

  // Booking Subsidies Management
  async createBookingSubsidy(subsidyData: InsertBookingSubsidy): Promise<BookingSubsidy> {
    const [subsidy] = await db.insert(bookingSubsidies).values(subsidyData).returning();
    return subsidy;
  }

  async getBookingSubsidies(filters?: { 
    promoCodeId?: number; 
    startDate?: Date; 
    endDate?: Date;
  }): Promise<BookingSubsidy[]> {
    let query = db.select().from(bookingSubsidies).orderBy(desc(bookingSubsidies.createdAt));

    const conditions = [];
    if (filters?.promoCodeId) {
      conditions.push(eq(bookingSubsidies.promoCodeId, filters.promoCodeId));
    }
    if (filters?.startDate) {
      conditions.push(sql`${bookingSubsidies.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${bookingSubsidies.createdAt} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  // User Commission Tiers Management
  async createUserCommissionTier(tierData: InsertUserCommissionTier): Promise<UserCommissionTier> {
    const [tier] = await db.insert(userCommissionTiers).values(tierData).returning();
    return tier;
  }

  async getUserCommissionTier(userId: number): Promise<UserCommissionTier | undefined> {
    const [tier] = await db.select()
      .from(userCommissionTiers)
      .where(and(
        eq(userCommissionTiers.userId, userId),
        eq(userCommissionTiers.isActive, true),
        sql`${userCommissionTiers.validFrom} <= NOW()`,
        or(
          sql`${userCommissionTiers.validUntil} IS NULL`,
          sql`${userCommissionTiers.validUntil} > NOW()`
        )
      ));
    return tier || undefined;
  }

  async getUserCommissionTiers(): Promise<UserCommissionTier[]> {
    return await db.select()
      .from(userCommissionTiers)
      .orderBy(desc(userCommissionTiers.createdAt));
  }

  async updateUserCommissionTier(id: number, tierData: Partial<UserCommissionTier>): Promise<UserCommissionTier | undefined> {
    const [updatedTier] = await db
      .update(userCommissionTiers)
      .set({ ...tierData, updatedAt: new Date() })
      .where(eq(userCommissionTiers.id, id))
      .returning();
    return updatedTier || undefined;
  }

  async deleteUserCommissionTier(id: number): Promise<boolean> {
    const result = await db.delete(userCommissionTiers).where(eq(userCommissionTiers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Get promo code analytics
  async getPromoCodeAnalytics(promoCodeId: number): Promise<{
    totalUsage: number;
    totalDiscountGiven: number;
    totalSubsidyPaid: number;
    uniqueUsers: number;
    conversionRate: number;
  }> {
    const usageStats = await db.select({
      totalUsage: sql<number>`COUNT(*)`,
      totalDiscountGiven: sql<number>`SUM(${promoCodeUsage.discountAmount})`,
      totalSubsidyPaid: sql<number>`SUM(${promoCodeUsage.subsidyAmount})`,
      uniqueUsers: sql<number>`COUNT(DISTINCT ${promoCodeUsage.userId})`
    })
    .from(promoCodeUsage)
    .where(eq(promoCodeUsage.promoCodeId, promoCodeId));

    const stats = usageStats[0] || {
      totalUsage: 0,
      totalDiscountGiven: 0,
      totalSubsidyPaid: 0,
      uniqueUsers: 0
    };

    // Simple conversion rate calculation (you may want to enhance this)
    const conversionRate = stats.totalUsage > 0 ? (stats.uniqueUsers / stats.totalUsage) * 100 : 0;

    return {
      ...stats,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  // Get platform subsidy amount for a booking (includes both promo codes and credits)
  async getPlatformSubsidyForBooking(bookingId: number): Promise<number> {
    // Check for promo code subsidies first
    const promoSubsidyResult = await db.select({
      subsidyAmount: promoCodeUsage.subsidyAmount
    })
    .from(promoCodeUsage)
    .where(eq(promoCodeUsage.bookingId, bookingId));

    const promoSubsidy = promoSubsidyResult[0]?.subsidyAmount || 0;

    // Check for credit subsidies by looking at credit usage for this booking
    const creditSubsidy = await this.calculateCreditSubsidyForBooking(bookingId);

    // Return total subsidy (promo + credit)
    return promoSubsidy + creditSubsidy;
  }

  // Get only promo code subsidy amount for a booking (excludes credit subsidies)
  async getPromoCodeSubsidyForBooking(bookingId: number): Promise<number> {
    // Check for promo code subsidies only
    const promoSubsidyResult = await db.select({
      subsidyAmount: promoCodeUsage.subsidyAmount
    })
    .from(promoCodeUsage)
    .where(eq(promoCodeUsage.bookingId, bookingId));

    return promoSubsidyResult[0]?.subsidyAmount || 0;
  }

  // Calculate platform subsidy needed for credit usage
  async calculateCreditSubsidyForBooking(bookingId: number): Promise<number> {
    try {
      // Get booking details
      const booking = await this.getBooking(bookingId);
      if (!booking) return 0;

      // Get class details to get original price
      const classItem = await this.getClass(booking.classId);
      if (!classItem) return 0;

      // Check if credits were used for this booking
      const creditUsage = await db.select({
        amount: userCredits.amount
      })
      .from(userCredits)
      .where(and(
        eq(userCredits.bookingId, bookingId),
        eq(userCredits.transactionType, 'referral_usage')
      ));

      if (!creditUsage.length) return 0;

      // Calculate total credits used (amount is negative for usage)
      const totalCreditsUsed = Math.abs(creditUsage.reduce((sum, credit) => sum + credit.amount, 0));
      
      if (totalCreditsUsed === 0) return 0;

      console.log("=== CALCULATING CREDIT SUBSIDY ===");
      console.log("Booking ID:", bookingId);
      console.log("Class price:", classItem.price);
      console.log("Credits used:", totalCreditsUsed, "cents");

      // Calculate what coach should earn at full price
      const originalPrice = classItem.price * (booking.quantity || 1); // Original price in dollars
      const originalPriceCents = originalPrice * 100; // Convert to cents
      const originalWithFee = Math.round(originalPriceCents * 1.05); // Add 5% service fee
      const originalStripeFee = Math.round(originalWithFee * 0.029) + 30; // 2.9% + $0.30
      const originalNetAmount = originalWithFee - originalStripeFee;
      const fullCoachPayout = Math.round(originalNetAmount * 0.85); // 85% to coach

      // Calculate what coach would earn at reduced price
      const reducedPriceCents = Math.max(0, originalPriceCents - totalCreditsUsed);
      const reducedWithFee = Math.round(reducedPriceCents * 1.05); // Add 5% service fee
      const reducedStripeFee = reducedPriceCents > 0 ? (Math.round(reducedWithFee * 0.029) + 30) : 0;
      const reducedNetAmount = reducedWithFee - reducedStripeFee;
      const reducedCoachPayout = Math.round(reducedNetAmount * 0.85); // 85% to coach

      // Platform subsidy = difference in coach payouts
      const subsidyAmount = fullCoachPayout - reducedCoachPayout;

      console.log("Original coach payout (cents):", fullCoachPayout);
      console.log("Reduced coach payout (cents):", reducedCoachPayout);
      console.log("Platform credit subsidy (cents):", subsidyAmount);

      return Math.max(0, subsidyAmount);
    } catch (error) {
      console.error("Error calculating credit subsidy for booking", bookingId, ":", error);
      return 0;
    }
  }

  // Referral system methods
  generateReferralCode(firstName: string, lastName: string, userId: number): string {
    const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    const userSuffix = userId.toString().padStart(4, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return namePrefix + userSuffix + randomSuffix;
  }

  generateProviderReferralCode(firstName: string, lastName: string, userId: number): string {
    const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    const userSuffix = userId.toString().padStart(4, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return 'PROV-' + namePrefix + userSuffix + randomSuffix;
  }

  async createReferral(referralData: InsertReferral): Promise<Referral> {
    const result = await db.insert(referrals).values(referralData).returning();
    return result[0];
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const result = await db.select().from(referrals).where(eq(referrals.referralCode, code));
    return result[0];
  }

  async getReferralsByReferrer(referrerId: number): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, referrerId)).orderBy(desc(referrals.createdAt));
  }

  async updateReferral(id: number, referralData: Partial<Referral>): Promise<Referral | undefined> {
    const result = await db.update(referrals).set(referralData).where(eq(referrals.id, id)).returning();
    return result[0];
  }

  // User credits methods
  async getUserCreditBalance(userId: number): Promise<number> {
    const result = await db.select({
      balance: sql<number>`SUM(${userCredits.amount})`
    })
    .from(userCredits)
    .where(eq(userCredits.userId, userId));

    return result[0]?.balance || 0;
  }

  async addUserCredit(creditData: InsertUserCredit): Promise<UserCredit> {
    const result = await db.insert(userCredits).values(creditData).returning();
    return result[0];
  }

  async getUserCreditHistory(userId: number): Promise<UserCredit[]> {
    return await db.select().from(userCredits).where(eq(userCredits.userId, userId)).orderBy(desc(userCredits.createdAt));
  }

  async getUserCredits(userId: number): Promise<UserCredit[]> {
    return await this.getUserCreditHistory(userId);
  }

  async applyCreditsToBooking(userId: number, amount: number, bookingId: number): Promise<UserCredit> {
    const creditData: InsertUserCredit = {
      userId,
      amount: -amount, // Negative for usage
      transactionType: 'referral_usage',
      description: `Used $${amount / 100} credit for booking`,
      bookingId
    };
    
    return await this.addUserCredit(creditData);
  }

  async deductUserCredits(userId: number, amountCents: number, description: string, bookingId?: number): Promise<UserCredit> {
    const creditData: InsertUserCredit = {
      userId,
      amount: -amountCents, // Negative amount for deduction
      transactionType: 'booking_payment',
      description,
      bookingId
    };
    
    return await this.addUserCredit(creditData);
  }

  async getCreditsUsedForBooking(bookingId: number): Promise<number> {
    const result = await db.select({
      totalUsed: sql<number>`SUM(ABS(${userCredits.amount}))`
    })
    .from(userCredits)
    .where(
      and(
        eq(userCredits.bookingId, bookingId),
        sql`${userCredits.amount} < 0` // Only negative amounts (credits used)
      )
    );

    return result[0]?.totalUsed || 0;
  }

  async hasExistingRefundForBooking(bookingId: number): Promise<boolean> {
    const result = await db.select({ id: userCredits.id })
      .from(userCredits)
      .where(
        and(
          eq(userCredits.bookingId, bookingId),
          eq(userCredits.transactionType, 'booking_refund'),
          sql`${userCredits.amount} > 0` // Only positive amounts (refunds)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async refundCreditsForBooking(userId: number, amount: number, bookingId: number, reason: string): Promise<UserCredit> {
    // Check if refund already exists to prevent double refunds
    const existingRefund = await this.hasExistingRefundForBooking(bookingId);
    if (existingRefund) {
      throw new Error(`Refund already processed for booking ${bookingId}`);
    }

    const creditData: InsertUserCredit = {
      userId,
      amount: amount, // Positive amount for refund
      transactionType: 'booking_refund', // Valid values include: 'referral_reward', 'referral_usage', 'booking_payment', 'booking_refund', 'admin_adjustment'
      description: `Refund: ${reason} - $${(amount / 100).toFixed(2)}`,
      bookingId
    };
    
    return await this.addUserCredit(creditData);
  }

  // Referral processing methods
  async processReferralSignup(referralCode: string, refereeId: number): Promise<Referral | undefined> {
    // Find existing referral
    const referral = await this.getReferralByCode(referralCode);
    if (!referral || referral.status !== 'pending') {
      return undefined;
    }

    // Check if referral hasn't expired
    if (new Date() > new Date(referral.expiresAt)) {
      return undefined;
    }

    // Update referral with referee ID and status
    return await this.updateReferral(referral.id, {
      refereeId,
      status: 'signed_up'
    });
  }

  async processReferralCompletion(refereeId: number): Promise<void> {
    // Find referral where this user is the referee
    const userReferrals = await db.select({
      id: referrals.id,
      referrerId: referrals.referrerId,
      refereeId: referrals.refereeId,
      referralCode: referrals.referralCode,
      refereeEmail: referrals.refereeEmail,
      status: referrals.status,
      completedAt: referrals.completedAt,
      rewardGranted: referrals.rewardGranted,
      expiresAt: referrals.expiresAt,
      createdAt: referrals.createdAt,
      referrerRole: users.role,
      referrerStripeConnectId: users.stripeConnectId,
      referrerStripeConnectOnboarded: users.stripeConnectOnboarded
    })
      .from(referrals)
      .innerJoin(users, eq(referrals.referrerId, users.id))
      .where(and(
        eq(referrals.refereeId, refereeId),
        eq(referrals.status, 'signed_up'),
        eq(referrals.rewardGranted, false)
      ));

    for (const referral of userReferrals) {
      // Mark referral as completed
      await this.updateReferral(referral.id, {
        status: 'completed',
        completedAt: new Date(),
        rewardGranted: true
      });

      const creditAmount = 500; // $5 in cents

      // Check if referrer is a provider (coach/admin)
      if ((referral.referrerRole === 'coach' || referral.referrerRole === 'admin') && 
          referral.referrerStripeConnectId && 
          referral.referrerStripeConnectOnboarded) {
        
        // Create Stripe transfer for provider referrers
        await this.createProviderReferralStripeTransfer(referral.referrerId, referral.id, creditAmount);
        
      } else {
        // Grant $5 credit to customer referrers (existing behavior)
        await this.addUserCredit({
          userId: referral.referrerId,
          amount: creditAmount,
          transactionType: 'referral_reward',
          description: 'Referral reward - friend completed first class',
          referralId: referral.id
        });
      }
    }
  }

  async getReferralStatusForUser(userId: number): Promise<{ status: string; referrerName: string; completedAt: Date | null } | null> {
    // Check if this user was referred by someone else (they are a referee)
    const referralData = await db
      .select({
        status: referrals.status,
        completedAt: referrals.completedAt,
        referrerFirstName: users.firstName,
        referrerLastName: users.lastName
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referrerId, users.id))
      .where(eq(referrals.refereeId, userId))
      .limit(1);

    if (referralData.length === 0) {
      return null;
    }

    const data = referralData[0];
    return {
      status: data.status,
      referrerName: `${data.referrerFirstName} ${data.referrerLastName}`,
      completedAt: data.completedAt
    };
  }

  async getUserReferralStatus(userId: number): Promise<{ status: string; isReferral: boolean } | null> {
    // Check if this user was referred by someone (they are a referee)
    const referralData = await db
      .select({
        status: referrals.status
      })
      .from(referrals)
      .where(eq(referrals.refereeId, userId))
      .limit(1);

    if (referralData.length === 0) {
      return null;
    }

    return {
      status: referralData[0].status,
      isReferral: true
    };
  }

  // Process referrer rewards for completed classes
  async processReferrerRewards(): Promise<void> {
    console.log("=== PROCESSING REFERRER REWARDS ===");
    const currentTime = new Date();
    console.log(`Current time (UTC): ${currentTime.toISOString()}`);
    
    // Find all referrals where referee has completed their first class but referrer hasn't been rewarded
    const referrerTable = alias(users, 'referrer');
    const refereeTable = alias(users, 'referee');
    
    const eligibleReferrals = await db
      .select({
        referralId: referrals.id,
        referrerId: referrals.referrerId,
        refereeId: referrals.refereeId,
        status: referrals.status,
        rewardGranted: referrals.rewardGranted,
        referrerEmail: referrerTable.email,
        refereeEmail: refereeTable.email,
        bookingId: bookings.id,
        classStartTime: classes.startTime
      })
      .from(referrals)
      .innerJoin(referrerTable, eq(referrals.referrerId, referrerTable.id))
      .innerJoin(refereeTable, eq(referrals.refereeId, refereeTable.id))
      .innerJoin(bookings, and(
        eq(bookings.userId, referrals.refereeId),
        eq(bookings.status, 'confirmed')
      ))
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(and(
        eq(referrals.status, 'signed_up'),
        eq(referrals.rewardGranted, false),
        lt(classes.startTime, currentTime) // Class has started
      ));

    console.log(`Found ${eligibleReferrals.length} eligible referrals for rewards`);

    // Group by referral to avoid duplicates (one referee might have multiple bookings)
    const processedReferrals = new Set<number>();

    for (const referral of eligibleReferrals) {
      if (processedReferrals.has(referral.referralId)) {
        continue; // Skip if already processed this referral
      }

      console.log(`Processing referral ${referral.referralId}: ${referral.referrerEmail} → ${referral.refereeEmail}`);
      console.log(`  - Class start time: ${referral.classStartTime}`);
      console.log(`  - Current time: ${currentTime.toISOString()}`);
      console.log(`  - Class has started: ${referral.classStartTime ? referral.classStartTime < currentTime : false}`);

      try {
        // Award $5 credit to referrer
        await this.addUserCredit({
          userId: referral.referrerId,
          amount: 500, // $5 in cents
          transactionType: 'referral_reward',
          description: `Referral reward - ${referral.refereeEmail} completed first class`,
          referralId: referral.referralId
        });

        // Mark referral as completed and reward granted
        await this.updateReferral(referral.referralId, {
          status: 'completed',
          completedAt: new Date(),
          rewardGranted: true
        });

        console.log(`✅ Awarded $5 to referrer ${referral.referrerEmail} for referral ${referral.referralId}`);
        processedReferrals.add(referral.referralId);

      } catch (error) {
        console.error(`❌ Error processing referral ${referral.referralId}:`, error);
      }
    }

    console.log(`=== COMPLETED: Processed ${processedReferrals.size} referrer rewards ===`);
  }

  // Check and award rewards for a specific referrer
  async checkAndAwardReferrerRewards(referrerId: number): Promise<number> {
    console.log(`=== CHECKING REWARDS FOR REFERRER ${referrerId} ===`);
    
    // Find all pending referrals for this referrer where referee completed first class
    const referee = alias(users, 'referee');
    const eligibleReferrals = await db
      .select({
        referralId: referrals.id,
        refereeId: referrals.refereeId,
        refereeEmail: referee.email,
        classStartTime: classes.startTime
      })
      .from(referrals)
      .innerJoin(referee, eq(referrals.refereeId, referee.id))
      .innerJoin(bookings, and(
        eq(bookings.userId, referrals.refereeId),
        eq(bookings.status, 'confirmed')
      ))
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(and(
        eq(referrals.referrerId, referrerId),
        eq(referrals.status, 'signed_up'),
        eq(referrals.rewardGranted, false),
        lt(classes.startTime, new Date()) // Class has started  
      ));

    console.log(`Found ${eligibleReferrals.length} eligible referrals for referrer ${referrerId}`);

    let rewardsAwarded = 0;
    const processedReferrals = new Set<number>();

    for (const referral of eligibleReferrals) {
      if (processedReferrals.has(referral.referralId)) {
        continue;
      }

      try {
        // Award $5 credit to referrer
        await this.addUserCredit({
          userId: referrerId,
          amount: 500, // $5 in cents
          transactionType: 'referral_reward',
          description: `Referral reward - ${referral.refereeEmail} completed first class`,
          referralId: referral.referralId
        });

        // Mark referral as completed
        await this.updateReferral(referral.referralId, {
          status: 'completed',
          completedAt: new Date(),
          rewardGranted: true
        });

        console.log(`✅ Awarded $5 to referrer ${referrerId} for referral ${referral.referralId}`);
        rewardsAwarded++;
        processedReferrals.add(referral.referralId);

      } catch (error) {
        console.error(`❌ Error processing referral ${referral.referralId}:`, error);
      }
    }

    console.log(`=== COMPLETED: Awarded ${rewardsAwarded} rewards to referrer ${referrerId} ===`);
    return rewardsAwarded;
  }

  // Provider Referral system methods
  async createProviderReferral(referralData: InsertProviderReferral): Promise<ProviderReferral> {
    const result = await db.insert(providerReferrals).values({
      ...referralData,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getProviderReferralByCode(code: string): Promise<ProviderReferral | undefined> {
    const result = await db
      .select()
      .from(providerReferrals)
      .where(eq(providerReferrals.referralCode, code))
      .limit(1);
    return result[0];
  }

  async getProviderReferralsByReferrer(referrerId: number): Promise<ProviderReferral[]> {
    return await db
      .select()
      .from(providerReferrals)
      .where(eq(providerReferrals.referrerId, referrerId));
  }

  async updateProviderReferral(id: number, referralData: Partial<ProviderReferral>): Promise<ProviderReferral | undefined> {
    const result = await db
      .update(providerReferrals)
      .set(referralData)
      .where(eq(providerReferrals.id, id))
      .returning();
    return result[0];
  }

  async processProviderReferralSignup(referralCode: string, providerId: number): Promise<ProviderReferral | undefined> {
    // Find the referrer user by their provider referral code
    const referrer = await this.getUserByProviderReferralCode(referralCode);
    if (!referrer) {
      console.log('Provider referrer not found for code:', referralCode);
      return undefined;
    }

    // Get the provider's details
    const provider = await this.getUser(providerId);
    if (!provider) {
      console.log('Provider not found for ID:', providerId);
      return undefined;
    }

    // Create a new provider referral entry
    const providerReferral = await this.createProviderReferral({
      referrerId: referrer.id,
      providerId: providerId,
      referralCode: referralCode,
      providerEmail: provider.email,
      status: 'signed_up',
      paidBookingsCount: 0,
      providerRewardGranted: false,
      referrerRewardGranted: false,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    });

    console.log('Created provider referral entry:', providerReferral.id);
    return providerReferral;
  }

  async updateProviderReferralBookingCount(providerId: number): Promise<void> {
    // Find all provider referrals for this provider
    const providerReferralsForProvider = await db
      .select()
      .from(providerReferrals)
      .where(and(
        eq(providerReferrals.providerId, providerId),
        eq(providerReferrals.status, 'signed_up')
      ));

    if (providerReferralsForProvider.length === 0) {
      return;
    }

    // Count confirmed bookings for classes taught by this provider
    // EXCLUDE bookings that used 100% discount promo codes (paymentMethod = 'promo_free')
    const confirmedBookingsCount = await db
      .select({ count: sql`count(*)` })
      .from(bookings)
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(and(
        eq(classes.coachId, providerId),
        eq(bookings.status, 'confirmed'),
        // Count paid bookings: price > 0, payment intent exists, OR credit-only booking
        or(
          sql`${classes.price} > 0`,
          sql`${bookings.stripePaymentIntentId} IS NOT NULL`,
          sql`${bookings.paymentMethod} = 'credit_free'`
        ),
        // EXCLUDE 100% discount promo code bookings (these have paymentMethod = 'promo_free')
        sql`${bookings.paymentMethod} != 'promo_free'`
      ));

    const totalPaidBookings = Number(confirmedBookingsCount[0]?.count || 0);

    // Update each provider referral with the current booking count
    for (const providerReferral of providerReferralsForProvider) {
      await this.updateProviderReferral(providerReferral.id, {
        paidBookingsCount: totalPaidBookings
      });

      // Check if provider has reached 3 paid bookings and needs rewards
      if (totalPaidBookings >= 3 && providerReferral.status === 'signed_up') {
        await this.updateProviderReferral(providerReferral.id, {
          status: 'qualified',
          qualifiedAt: new Date()
        });
      }
    }
  }

  async processProviderReferralRewards(): Promise<void> {
    console.log("=== PROCESSING PROVIDER REFERRAL REWARDS ===");
    
    // Find all qualified provider referrals where rewards haven't been granted
    const qualifiedReferrals = await db
      .select({
        id: providerReferrals.id,
        referrerId: providerReferrals.referrerId,
        providerId: providerReferrals.providerId,
        paidBookingsCount: providerReferrals.paidBookingsCount,
        providerRewardGranted: providerReferrals.providerRewardGranted,
        referrerRewardGranted: providerReferrals.referrerRewardGranted
      })
      .from(providerReferrals)
      .where(and(
        eq(providerReferrals.status, 'qualified'),
        sql`${providerReferrals.paidBookingsCount} >= 3`
      ));

    console.log(`Found ${qualifiedReferrals.length} qualified provider referrals to process`);

    for (const referral of qualifiedReferrals) {
      try {
        // Award $25 to provider if not already granted
        if (!referral.providerRewardGranted && referral.providerId) {
          await this.createScheduledPayout({
            coachId: referral.providerId,
            amountCents: 2500, // $25 in cents
            stripeFee: 0,
            netAmount: 2500,
            coachPayout: 2500,
            platformFee: 0,
            payoutType: 'provider_referral_reward',
            providerReferralId: referral.id,
            scheduledPayoutDate: new Date(), // Pay immediately
            status: 'scheduled'
          });

          await this.updateProviderReferral(referral.id, {
            providerRewardGranted: true
          });

          console.log(`✅ Scheduled $25 payout for provider ${referral.providerId} (referral ${referral.id})`);
        }

        // Award $25 to referrer if not already granted
        if (!referral.referrerRewardGranted) {
          // Check if referrer is a provider (coach/admin) or customer
          const referrer = await this.getUser(referral.referrerId);
          
          if (referrer && (referrer.role === 'coach' || referrer.role === 'admin')) {
            // Provider-to-provider referral: Give payout instead of credit
            await this.createScheduledPayout({
              coachId: referral.referrerId,
              amountCents: 2500, // $25 in cents
              stripeFee: 0,
              netAmount: 2500,
              coachPayout: 2500,
              platformFee: 0,
              payoutType: 'provider_referral_reward',
              providerReferralId: referral.id,
              scheduledPayoutDate: new Date(), // Pay immediately
              status: 'scheduled'
            });
            
            console.log(`✅ Scheduled $25 payout for referring provider ${referral.referrerId} (referral ${referral.id})`);
          } else {
            // Customer-to-provider referral: Give account credit as before
            await this.addUserCredit({
              userId: referral.referrerId,
              amount: 2500, // $25 in cents
              transactionType: 'provider_referral_reward',
              description: `Provider referral reward - Referred provider reached 3 paid bookings`
            });
            
            console.log(`✅ Awarded $25 credit to referring customer ${referral.referrerId} (referral ${referral.id})`);
          }

          await this.updateProviderReferral(referral.id, {
            referrerRewardGranted: true,
            status: 'completed'
          });
        }

      } catch (error) {
        console.error(`❌ Error processing provider referral ${referral.id}:`, error);
      }
    }

    console.log("=== COMPLETED: Provider referral rewards processing ===");
  }

  async getProviderReferralsByProvider(providerId: number): Promise<ProviderReferral[]> {
    return await db
      .select()
      .from(providerReferrals)
      .where(eq(providerReferrals.providerId, providerId));
  }

  // SEO Landing Page Methods
  async getOutdoorWorkoutClassesSF(): Promise<Array<Class & { coach: User; category: ClassCategory }>> {
    try {
      // Get classes with coach and category data using existing SQL queries
      const result = await db
        .select({
          // Class fields
          id: classes.id,
          title: classes.title,
          description: classes.description,
          coachId: classes.coachId,
          categoryId: classes.categoryId,
          price: classes.price,
          capacity: classes.capacity,
          location: classes.location,
          latitude: classes.latitude,
          longitude: classes.longitude,
          address: classes.address,
          street: classes.street,
          city: classes.city,
          state: classes.state,
          zipCode: classes.zipCode,
          image: classes.image,
          startTime: classes.startTime,
          endTime: classes.endTime,
          isRecurring: classes.isRecurring,
          parentClassId: classes.parentClassId,
          recurringSeriesId: classes.recurringSeriesId,
          recurrenceType: classes.recurrenceType,
          recurrenceInterval: classes.recurrenceInterval,
          recurrenceDaysOfWeek: classes.recurrenceDaysOfWeek,
          recurrenceEndType: classes.recurrenceEndType,
          recurrenceEndDate: classes.recurrenceEndDate,
          recurrenceEndCount: classes.recurrenceEndCount,
          whatToBring: classes.whatToBring,
          toFindUs: classes.toFindUs,
          ageGroup: classes.ageGroup,
          createdAt: classes.createdAt,
          // Coach fields
          coachEmail: users.email,
          coachFirstName: users.firstName,
          coachLastName: users.lastName,
          coachBusinessName: users.businessName,
          coachDisplayBusinessName: users.displayBusinessName,
          coachPhone: users.phone,
          coachRole: users.role,
          coachBio: users.bio,
          coachProfileImage: users.profileImage,
          coachIsApproved: users.isApproved,
          coachCreatedAt: users.createdAt,
          coachStripeCustomerId: users.stripeCustomerId,
          coachStripeConnectId: users.stripeConnectId,
          coachStripeConnectOnboarded: users.stripeConnectOnboarded,
          coachBankAccountVerified: users.bankAccountVerified,
          coachAreasOfExpertise: users.areasOfExpertise,
          coachCertifications: users.certifications,
          coachGoogleId: users.googleId,
          coachAuthMethod: users.authMethod,
          coachGoogleProfilePicture: users.googleProfilePicture,
          coachReferralCode: users.referralCode,
          coachProviderReferralCode: users.providerReferralCode,
          coachPassword: users.password,
          // Category fields
          categoryName: classCategories.name,
          categoryImage: classCategories.image
        })
        .from(classes)
        .innerJoin(users, eq(classes.coachId, users.id))
        .innerJoin(classCategories, eq(classes.categoryId, classCategories.id))
        .where(
          and(
            eq(classes.city, 'San Francisco'),
            eq(users.isApproved, true),
            or(
              // Outdoor categories
              inArray(classes.categoryId, [2, 3, 4, 1, 16]), // Yoga, Strength & Conditioning, Cardio, HIIT, Personal Training
              // Or outdoor locations
              sql`LOWER(${classes.location}) LIKE '%park%'`,
              sql`LOWER(${classes.location}) LIKE '%beach%'`,
              sql`LOWER(${classes.location}) LIKE '%outdoor%'`,
              sql`LOWER(${classes.location}) LIKE '%dolores%'`,
              sql`LOWER(${classes.location}) LIKE '%golden gate%'`,
              sql`LOWER(${classes.location}) LIKE '%presidio%'`,
              sql`LOWER(${classes.location}) LIKE '%marina%'`,
              sql`LOWER(${classes.location}) LIKE '%embarcadero%'`,
              sql`LOWER(${classes.location}) LIKE '%crissy%'`
            )
          )
        )
        .limit(20);

      // Transform to expected format
      return result.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        coachId: row.coachId,
        categoryId: row.categoryId,
        price: row.price,
        capacity: row.capacity,
        location: row.location,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
        street: row.street,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        image: row.image,
        startTime: row.startTime,
        endTime: row.endTime,
        isRecurring: row.isRecurring,
        parentClassId: row.parentClassId,
        recurringSeriesId: row.recurringSeriesId,
        recurrenceType: row.recurrenceType,
        recurrenceInterval: row.recurrenceInterval,
        recurrenceDaysOfWeek: row.recurrenceDaysOfWeek,
        recurrenceEndType: row.recurrenceEndType,
        recurrenceEndDate: row.recurrenceEndDate,
        recurrenceEndCount: row.recurrenceEndCount,
        whatToBring: row.whatToBring,
        toFindUs: row.toFindUs,
        ageGroup: row.ageGroup,
        createdAt: row.createdAt,
        coach: {
          id: row.coachId,
          email: row.coachEmail,
          firstName: row.coachFirstName,
          lastName: row.coachLastName,
          businessName: row.coachBusinessName,
          displayBusinessName: row.coachDisplayBusinessName,
          phone: row.coachPhone,
          role: row.coachRole,
          bio: row.coachBio,
          profileImage: row.coachProfileImage,
          isApproved: row.coachIsApproved,
          createdAt: row.coachCreatedAt,
          stripeCustomerId: row.coachStripeCustomerId,
          stripeConnectId: row.coachStripeConnectId,
          stripeConnectOnboarded: row.coachStripeConnectOnboarded,
          bankAccountVerified: row.coachBankAccountVerified,
          areasOfExpertise: row.coachAreasOfExpertise,
          certifications: row.coachCertifications,
          googleId: row.coachGoogleId,
          authMethod: row.coachAuthMethod,
          googleProfilePicture: row.coachGoogleProfilePicture,
          referralCode: row.coachReferralCode,
          providerReferralCode: row.coachProviderReferralCode,
          password: row.coachPassword
        },
        category: {
          id: row.categoryId,
          name: row.categoryName,
          image: row.categoryImage
        }
      }));
    } catch (error) {
      console.error("Error getting outdoor workout classes for SF:", error);
      throw error;
    }
  }

  // Package Purchase Management Methods
  async createPackagePurchase(purchaseData: InsertPackagePurchase): Promise<PackagePurchase> {
    // Calculate financial values (following the scheduled_payouts pattern)
    const priceFloat = parseFloat(purchaseData.price as string);
    
    // Calculate Stripe fee (same as scheduled payouts: 2.9% + $0.30)
    const stripeFee = Math.round((priceFloat * 0.029 + 0.30) * 100) / 100;
    
    // Net amount after stripe fees
    const netAmount = Math.round((priceFloat - stripeFee) * 100) / 100;
    
    // Platform fee is 15% of net amount
    const platformFee = Math.round((netAmount * 0.15) * 100) / 100;
    
    // Total provider payout is 85% of net amount
    const totalProviderPayout = Math.round((netAmount * 0.85) * 100) / 100;
    
    // First provider payout is 25% of total provider payout
    const firstProviderPayout = Math.round((totalProviderPayout * 0.25) * 100) / 100;
    
    // Calculate expiration date based on package type and class count
    let expirationDate: Date | undefined;
    if (purchaseData.packageType === 'set_pack') {
      const today = new Date();
      const classCount = purchaseData.classCount;
      
      if (classCount === 5) {
        // 5-class pack: 2 months
        expirationDate = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());
      } else if (classCount === 10) {
        // 10-class pack: 3 months
        expirationDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
      } else if (classCount === 20) {
        // 20-class pack: 6 months
        expirationDate = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
      }
    } else if (purchaseData.expirationDate) {
      // For time-bound packages, use manually set expiration date
      expirationDate = new Date(purchaseData.expirationDate);
    }
    
    // Prepare purchase data with calculated values
    const completePurchaseData = {
      ...purchaseData,
      stripeFee: stripeFee.toFixed(2),
      netAmount: netAmount.toFixed(2),
      platformFee: platformFee.toFixed(2),
      firstProviderPayout: firstProviderPayout.toFixed(2),
      remainingClasses: purchaseData.classCount,
      expirationDate: expirationDate,
    };
    
    const [purchase] = await db.insert(packagePurchases).values(completePurchaseData).returning();
    return purchase;
  }

  async getPackagePurchase(id: number): Promise<PackagePurchase | undefined> {
    const result = await db.select()
      .from(packagePurchases)
      .where(eq(packagePurchases.id, id));
    
    return result[0];
  }

  async getUserPackagePurchases(userId: number): Promise<PackagePurchase[]> {
    const result = await db.select()
      .from(packagePurchases)
      .where(eq(packagePurchases.userId, userId))
      .orderBy(desc(packagePurchases.purchaseDate));
    
    return result;
  }

  async updatePackagePurchase(id: number, purchaseData: Partial<PackagePurchase>): Promise<PackagePurchase | undefined> {
    const [updated] = await db.update(packagePurchases)
      .set({
        ...purchaseData,
        updatedAt: new Date(),
      })
      .where(eq(packagePurchases.id, id))
      .returning();
    
    return updated;
  }

  // Package Booking Management Methods
  async createPackageBooking(bookingData: InsertPackageBooking): Promise<PackageBooking> {
    const [packageBooking] = await db.insert(packageBookings).values({
      ...bookingData,
      updatedAt: new Date(),
    }).returning();
    return packageBooking;
  }

  async getPackageBooking(id: number): Promise<PackageBooking | undefined> {
    const result = await db.select()
      .from(packageBookings)
      .where(eq(packageBookings.id, id));
    
    return result[0];
  }

  async getPackageBookingByBookingId(bookingId: number): Promise<PackageBooking | undefined> {
    const result = await db.select()
      .from(packageBookings)
      .where(eq(packageBookings.bookingId, bookingId));
    
    return result[0];
  }

  async getUserPackageBookings(userId: number): Promise<PackageBooking[]> {
    const result = await db.select()
      .from(packageBookings)
      .leftJoin(packagePurchases, eq(packageBookings.packagePurchaseId, packagePurchases.id))
      .where(eq(packagePurchases.userId, userId))
      .orderBy(desc(packageBookings.classDate));
    
    return result.map(row => row.package_bookings);
  }

  async getPackageBookingsByPackagePurchase(packagePurchaseId: number): Promise<PackageBooking[]> {
    const result = await db.select()
      .from(packageBookings)
      .where(eq(packageBookings.packagePurchaseId, packagePurchaseId))
      .orderBy(desc(packageBookings.classDate));
    
    return result;
  }

  async updatePackageBooking(id: number, bookingData: Partial<PackageBooking>): Promise<PackageBooking | undefined> {
    const [updated] = await db.update(packageBookings)
      .set({
        ...bookingData,
        updatedAt: new Date(),
      })
      .where(eq(packageBookings.id, id))
      .returning();
    
    return updated;
  }

  // Email Reminder Tracking methods
  async getEmailReminderTracking(processType: string): Promise<EmailReminderTracking | undefined> {
    const result = await db.select()
      .from(emailReminderTracking)
      .where(eq(emailReminderTracking.processType, processType));
    return result[0];
  }

  async upsertEmailReminderTracking(processType: string, lastProcessedDate: string): Promise<EmailReminderTracking> {
    const existing = await this.getEmailReminderTracking(processType);
    
    if (existing) {
      const [updated] = await db.update(emailReminderTracking)
        .set({
          lastProcessedDate,
          lastProcessedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailReminderTracking.processType, processType))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(emailReminderTracking)
        .values({
          processType,
          lastProcessedDate,
          lastProcessedAt: new Date(),
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
