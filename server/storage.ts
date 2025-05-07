import { users, type User, type InsertUser, classes, type Class, type InsertClass, bookings, type Booking, type InsertBooking, reviews, type Review, type InsertReview, classCategories, type ClassCategory, type InsertClassCategory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Extended storage interface
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
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

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private classesMap: Map<number, Class>;
  private bookingsMap: Map<number, Booking>;
  private reviewsMap: Map<number, Review>;
  private classCategoriesMap: Map<number, ClassCategory>;
  
  private userId: number = 1;
  private classId: number = 1;
  private bookingId: number = 1;
  private reviewId: number = 1;
  private categoryId: number = 1;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this.usersMap = new Map();
    this.classesMap = new Map();
    this.bookingsMap = new Map();
    this.reviewsMap = new Map();
    this.classCategoriesMap = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some categories
    this.initializeCategories();
  }
  
  private initializeCategories() {
    const categories = [
      { name: 'HIIT', image: 'https://images.unsplash.com/photo-1517130038641-a774d04afb3c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
      { name: 'Yoga', image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
      { name: 'Strength', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
      { name: 'Cardio', image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400' },
    ];
    
    categories.forEach(category => {
      this.createClassCategory(category);
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...userData, id, createdAt: new Date(), isApproved: userData.role === 'customer' };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }
  
  async getCoaches(): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(user => user.role === 'coach');
  }
  
  async getApprovedCoaches(): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(user => user.role === 'coach' && user.isApproved);
  }
  
  async approveCoach(id: number): Promise<User | undefined> {
    const coach = await this.getUser(id);
    if (!coach || coach.role !== 'coach') return undefined;
    
    coach.isApproved = true;
    this.usersMap.set(id, coach);
    return coach;
  }
  
  // Class category methods
  async createClassCategory(category: InsertClassCategory): Promise<ClassCategory> {
    const id = this.categoryId++;
    const newCategory: ClassCategory = { ...category, id };
    this.classCategoriesMap.set(id, newCategory);
    return newCategory;
  }
  
  async getAllClassCategories(): Promise<ClassCategory[]> {
    return Array.from(this.classCategoriesMap.values());
  }
  
  async getClassCategory(id: number): Promise<ClassCategory | undefined> {
    return this.classCategoriesMap.get(id);
  }
  
  // Class methods
  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.classId++;
    const newClass: Class = { ...classData, id, createdAt: new Date() };
    this.classesMap.set(id, newClass);
    return newClass;
  }
  
  async getClass(id: number): Promise<Class | undefined> {
    return this.classesMap.get(id);
  }
  
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classesMap.values());
  }
  
  async getUserClasses(userId: number): Promise<Class[]> {
    // Get all classes that the user has booked
    const userBookings = await this.getUserBookings(userId);
    const classIds = userBookings.map(booking => booking.classId);
    
    return Array.from(this.classesMap.values()).filter(
      classItem => classIds.includes(classItem.id)
    );
  }
  
  async getClassesByCategory(categoryId: number): Promise<Class[]> {
    return Array.from(this.classesMap.values()).filter(
      classItem => classItem.categoryId === categoryId
    );
  }
  
  async getClassesByCoach(coachId: number): Promise<Class[]> {
    return Array.from(this.classesMap.values()).filter(
      classItem => classItem.coachId === coachId
    );
  }
  
  async updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined> {
    const classItem = await this.getClass(id);
    if (!classItem) return undefined;
    
    const updatedClass = { ...classItem, ...classData };
    this.classesMap.set(id, updatedClass);
    return updatedClass;
  }
  
  async deleteClass(id: number): Promise<boolean> {
    return this.classesMap.delete(id);
  }
  
  // Booking methods
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const id = this.bookingId++;
    const booking: Booking = { ...bookingData, id, createdAt: new Date() };
    this.bookingsMap.set(id, booking);
    return booking;
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookingsMap.get(id);
  }
  
  async getUserBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookingsMap.values()).filter(
      booking => booking.userId === userId
    );
  }
  
  async getClassBookings(classId: number): Promise<Booking[]> {
    return Array.from(this.bookingsMap.values()).filter(
      booking => booking.classId === classId
    );
  }
  
  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = await this.getBooking(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...bookingData };
    this.bookingsMap.set(id, updatedBooking);
    return updatedBooking;
  }
  
  // Review methods
  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const review: Review = { ...reviewData, id, createdAt: new Date() };
    this.reviewsMap.set(id, review);
    return review;
  }
  
  async getClassReviews(classId: number): Promise<Review[]> {
    return Array.from(this.reviewsMap.values()).filter(
      review => review.classId === classId
    );
  }
  
  async getUserReviews(userId: number): Promise<Review[]> {
    return Array.from(this.reviewsMap.values()).filter(
      review => review.userId === userId
    );
  }
  
  // Stripe
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, stripeCustomerId };
    this.usersMap.set(userId, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();
