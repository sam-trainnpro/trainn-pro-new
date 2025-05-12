import { pgTable, text, serial, integer, boolean, timestamp, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("customer"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  stripeCustomerId: text("stripe_customer_id"), 
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
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
  // For recurring classes
  isRecurring: boolean("is_recurring").default(false),
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
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  classId: true,
  status: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  classId: integer("class_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  classId: true,
  rating: true,
  comment: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
