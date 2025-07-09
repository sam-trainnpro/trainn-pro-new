import { pgTable, text, serial, integer, boolean, timestamp, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectId: text("stripe_connect_id"), // For coaches to receive payments
  stripeConnectOnboarded: boolean("stripe_connect_onboarded").default(false), // Track if they've completed onboarding
  bankAccountVerified: boolean("bank_account_verified").default(false), // Track if bank account is verified
  areasOfExpertise: integer("areas_of_expertise").array().default([]),
  certifications: text("certifications"),
  // Google OAuth fields
  googleId: text("google_id"),
  authMethod: text("auth_method").notNull().default("password"), // 'password', 'google', or 'both'
  googleProfilePicture: text("google_profile_picture"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  googleId: true,
  authMethod: true,
  googleProfilePicture: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Class categories
export const classCategories = pgTable("class_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  image: text("image"),
});

export const insertClassCategorySchema = createInsertSchema(classCategories).pick({
  name: true,
  image: true,
});

export type InsertClassCategory = z.infer<typeof insertClassCategorySchema>;
export type ClassCategory = typeof classCategories.$inferSelect;

// Class schedules - used for recurring classes
export const classSchedules = pgTable("class_schedules", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // Format: "HH:MM" in 24-hour format
  endTime: text("end_time").notNull(), // Format: "HH:MM" in 24-hour format
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coachId: integer("coach_id").notNull(),
  categoryId: integer("category_id").notNull(),
  price: real("price").notNull(),
  capacity: integer("capacity").notNull(),
  location: text("location").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  address: text("address").notNull(),
  image: text("image"),
  // For single occurrence classes
  startTime: timestamp("start_time"), // Made optional
  endTime: timestamp("end_time"), // Made optional
  // Recurring class functionality
  isRecurring: boolean("is_recurring").default(false),
  parentClassId: integer("parent_class_id"), // Links to parent class for recurring instances (legacy)
  recurringSeriesId: text("recurring_series_id"), // Links recurring instances together
  // Recurrence pattern fields
  recurrenceType: text("recurrence_type"), // 'daily', 'weekly', 'monthly'
  recurrenceInterval: integer("recurrence_interval"), // every X days/weeks/months
  recurrenceDaysOfWeek: text("recurrence_days_of_week"), // JSON array of days [0-6] for weekly
  recurrenceEndType: text("recurrence_end_type"), // 'date', 'count'
  recurrenceEndDate: timestamp("recurrence_end_date"),
  recurrenceEndCount: integer("recurrence_end_count"),
  // Storage for what to bring information
  whatToBring: text("what_to_bring"),
  // Age group for the class
  ageGroup: text("age_group").notNull().default("Adults"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).pick({
  title: true,
  description: true,
  coachId: true,
  categoryId: true,
  price: true,
  capacity: true,
  location: true,
  latitude: true,
  longitude: true,
  address: true,
  image: true,
  startTime: true,
  endTime: true,
  isRecurring: true,
  parentClassId: true,
  recurringSeriesId: true,
  recurrenceType: true,
  recurrenceInterval: true,
  recurrenceDaysOfWeek: true,
  recurrenceEndType: true,
  recurrenceEndDate: true,
  recurrenceEndCount: true,
  whatToBring: true,
  ageGroup: true,
});

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Class Schedule schema for insertion
export const insertClassScheduleSchema = createInsertSchema(classSchedules).pick({
  classId: true, 
  dayOfWeek: true,
  startTime: true,
  endTime: true,
});

export type InsertClassSchedule = z.infer<typeof insertClassScheduleSchema>;
export type ClassSchedule = typeof classSchedules.$inferSelect;

// Extended type to include schedules with a class
export type ClassWithSchedules = Class & {
  schedules?: ClassSchedule[];
};

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  classId: integer("class_id").notNull(),
  quantity: integer("quantity").notNull().default(1), // Number of spots booked
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, refunded
  stripePaymentId: text("stripe_payment_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferId: text("stripe_transfer_id"), // For tracking coach payouts
  paymentMethod: text("payment_method"), // stripe, paypal
  amount: integer("amount"), // Amount in cents
  currency: text("currency").default("usd"),
  platformFee: integer("platform_fee"), // 15% fee in cents
  coachPayout: integer("coach_payout"), // 85% payout in cents
  payoutStatus: text("payout_status").default("pending"), // pending, paid, failed
  createdAt: timestamp("created_at").defaultNow(),
  paymentDate: timestamp("payment_date"),
  payoutDate: timestamp("payout_date"),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  classId: true,
  quantity: true,
  status: true,
  stripePaymentIntentId: true,
  paymentDate: true,
  paymentMethod: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  classId: integer("class_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  coachId: integer("coach_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  classId: true,
  bookingId: true,
  coachId: true,
  rating: true,
  comment: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Contact Messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Blog Posts
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  slug: text("slug").notNull().unique(),
  featuredImage: text("featured_image"),
  authorId: integer("author_id").notNull(),
  status: text("status").notNull().default("draft"), // draft, published, archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tags: text("tags").array().default([]),
  metaDescription: text("meta_description"),
  readTime: integer("read_time"), // estimated read time in minutes
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
