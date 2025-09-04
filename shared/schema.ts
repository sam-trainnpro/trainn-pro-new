import { pgTable, text, serial, integer, boolean, timestamp, real, doublePrecision, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  businessName: text("business_name"),
  displayBusinessName: boolean("display_business_name").default(false),
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
  // Referral system
  referralCode: text("referral_code").unique(), // Unique referral code for each user
  providerReferralCode: text("provider_referral_code").unique(), // Unique provider referral code for each user
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
  address: text("address").notNull(), // Keep for backward compatibility
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
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
  // Information on how to find the class location
  toFindUs: text("to_find_us"),
  // Age group for the class
  ageGroup: text("age_group").notNull().default("Adults"),
  // Whether the class is outdoors
  outdoors: boolean("outdoors").default(false),
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
  street: true,
  city: true,
  state: true,
  zipCode: true,
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
  toFindUs: true,
  ageGroup: true,
  outdoors: true,
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

// Scheduled Payouts
export const scheduledPayouts = pgTable("scheduled_payouts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id"), // Nullable for referral rewards
  classId: integer("class_id"), // Nullable for referral rewards
  packagePurchasesId: integer("package_purchases_id"), // Nullable, only for package purchases
  classPackageId: integer("class_package_id"), // Nullable, FK to class_packages table
  coachId: integer("coach_id").notNull(),
  customerId: integer("customer_id"), // Nullable for referral rewards
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Nullable for referral rewards
  amountCents: integer("amount_cents").notNull(), // Total payment amount
  stripeFee: integer("stripe_fee").notNull().default(0), // Stripe processing fee
  netAmount: integer("net_amount").notNull(), // Amount after Stripe fees
  coachPayout: integer("coach_payout").notNull(), // Amount to pay coach
  platformFee: integer("platform_fee").notNull().default(0), // Platform fee
  payoutType: text("payout_type").notNull().default("booking"), // 'booking', 'provider_referral_reward', 'fully_subsidized_booking', 'package_purchase'
  providerReferralId: integer("provider_referral_id"), // FK for provider referral rewards
  scheduledPayoutDate: timestamp("scheduled_payout_date").notNull(), // When to pay coach
  status: text("status").notNull().default("scheduled"), // scheduled, processing, completed, failed
  stripeTransferId: text("stripe_transfer_id"), // Stripe transfer ID when completed
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertScheduledPayoutSchema = createInsertSchema(scheduledPayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScheduledPayout = z.infer<typeof insertScheduledPayoutSchema>;
export type ScheduledPayout = typeof scheduledPayouts.$inferSelect;

// Promo Codes
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // The actual promo code (e.g., "WELCOME10")
  name: text("name").notNull(), // Display name for admin purposes
  description: text("description"), // Optional description
  discountType: text("discount_type").notNull(), // "percentage" or "fixed"
  discountValue: integer("discount_value").notNull(), // Percentage (0-100) or fixed amount in cents
  coachId: integer("coach_id"), // Optional: coach-specific code
  isActive: boolean("is_active").notNull().default(true),
  requiresApproval: boolean("requires_approval").notNull().default(false), // Coach codes need approval
  isApproved: boolean("is_approved").notNull().default(true), // Admin codes auto-approved
  approvedBy: integer("approved_by"), // Admin user ID who approved
  approvedAt: timestamp("approved_at"),
  firstBookingOnly: boolean("first_booking_only").notNull().default(false),
  minimumQuantity: integer("minimum_quantity").notNull().default(1), // Minimum tickets required for discount
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").notNull().default(0),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  platformSubsidized: boolean("platform_subsidized").notNull().default(false), // Platform pays difference
  commissionOverride: integer("commission_override"), // Override platform commission (0-100)
  budgetLimit: integer("budget_limit"), // Maximum subsidy budget in cents
  budgetUsed: integer("budget_used").notNull().default(0),
  createdBy: integer("created_by").notNull(), // User ID who created
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  usageCount: true,
  budgetUsed: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

// Promo Code Usage Tracking
export const promoCodeUsage = pgTable("promo_code_usage", {
  id: serial("id").primaryKey(),
  promoCodeId: integer("promo_code_id").notNull(),
  userId: integer("user_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  discountAmount: integer("discount_amount").notNull(), // Amount discounted in cents
  subsidyAmount: integer("subsidy_amount").notNull().default(0), // Platform subsidy in cents
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromoCodeUsageSchema = createInsertSchema(promoCodeUsage).omit({
  id: true,
  createdAt: true,
});

export type InsertPromoCodeUsage = z.infer<typeof insertPromoCodeUsageSchema>;
export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;

// Booking Subsidies for ROI tracking
export const bookingSubsidies = pgTable("booking_subsidies", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  promoCodeId: integer("promo_code_id").notNull(),
  promoCodeUsageId: integer("promo_code_usage_id").notNull(),
  originalAmount: integer("original_amount").notNull(), // Full price in cents
  customerPaid: integer("customer_paid").notNull(), // Amount customer paid in cents
  subsidyAmount: integer("subsidy_amount").notNull(), // Platform subsidy in cents
  coachEarnings: integer("coach_earnings").notNull(), // Coach still gets full amount
  platformFee: integer("platform_fee").notNull(), // Platform fee in cents
  commissionRate: integer("commission_rate").notNull(), // Commission rate used (0-100)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSubsidySchema = createInsertSchema(bookingSubsidies).omit({
  id: true,
  createdAt: true,
});

export type InsertBookingSubsidy = z.infer<typeof insertBookingSubsidySchema>;
export type BookingSubsidy = typeof bookingSubsidies.$inferSelect;

// User Commission Tiers (VIP/Partner/Influencer rates)
export const userCommissionTiers = pgTable("user_commission_tiers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  tierName: text("tier_name").notNull(), // "VIP", "Partner", "Influencer", etc.
  commissionRate: integer("commission_rate").notNull(), // Custom commission rate (0-100)
  isActive: boolean("is_active").notNull().default(true),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until"),
  assignedBy: integer("assigned_by").notNull(), // Admin user ID
  notes: text("notes"), // Internal notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserCommissionTierSchema = createInsertSchema(userCommissionTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserCommissionTier = z.infer<typeof insertUserCommissionTierSchema>;
export type UserCommissionTier = typeof userCommissionTiers.$inferSelect;

// Referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(), // User who sent the referral
  refereeId: integer("referee_id"), // User who was referred (null until they sign up)
  referralCode: text("referral_code").notNull(), // The referrer's unique code
  refereeEmail: text("referee_email"), // Email of referred person (optional)
  status: text("status").notNull().default("pending"), // 'pending', 'signed_up', 'completed'
  completedAt: timestamp("completed_at"), // When referee completed their first paid class
  rewardGranted: boolean("reward_granted").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(), // 60 days from creation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// User Credits - Transaction-based credit system
export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // Amount in cents (positive for earned, negative for used)
  transactionType: text("transaction_type").notNull(), // 'referral_reward', 'referral_usage', 'admin_adjustment'
  description: text("description").notNull(),
  referralId: integer("referral_id"), // FK to referrals table (nullable)
  bookingId: integer("booking_id"), // FK to bookings table when used (nullable)
  expiresAt: timestamp("expires_at"), // Optional expiration for credits
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserCreditSchema = createInsertSchema(userCredits).omit({
  id: true,
  createdAt: true,
});

export type InsertUserCredit = z.infer<typeof insertUserCreditSchema>;
export type UserCredit = typeof userCredits.$inferSelect;

// Provider Referrals - Track when providers are referred
export const providerReferrals = pgTable("provider_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(), // Customer who referred the provider
  providerId: integer("provider_id"), // Provider who was referred (null until they sign up)
  referralCode: text("referral_code").notNull(), // The referrer's unique code
  providerEmail: text("provider_email"), // Email of referred provider (optional)
  status: text("status").notNull().default("pending"), // 'pending', 'signed_up', 'qualified', 'completed'
  paidBookingsCount: integer("paid_bookings_count").notNull().default(0), // Track paid bookings by referred provider
  qualifiedAt: timestamp("qualified_at"), // When provider reached 3 paid bookings
  providerRewardGranted: boolean("provider_reward_granted").notNull().default(false), // $25 to provider
  referrerRewardGranted: boolean("referrer_reward_granted").notNull().default(false), // $25 credit to referrer
  expiresAt: timestamp("expires_at").notNull(), // 60 days from creation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProviderReferralSchema = createInsertSchema(providerReferrals).omit({
  id: true,
  createdAt: true,
});

export type InsertProviderReferral = z.infer<typeof insertProviderReferralSchema>;
export type ProviderReferral = typeof providerReferrals.$inferSelect;

// Class Packages - Provider-created package offerings
export const classPackages = pgTable("class_packages", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id").notNull(), // FK to users (providers)
  title: text("title").notNull(), // "5-Class Yoga Package"
  packageType: text("package_type").notNull(), // "set_pack" or "time_bound"
  
  // For set packs
  classCount1: integer("class_count_1"), // First option (e.g., 5 classes)
  classCount2: integer("class_count_2"), // Second option (e.g., 10 classes)
  classCount3: integer("class_count_3"), // Third option (e.g., 20 classes)
  price1: real("price_1"), // Price for first class count option
  price2: real("price_2"), // Price for second class count option
  price3: real("price_3"), // Price for third class count option
  
  // Eligible classes for this package
  eligibleClasses: text("eligible_classes"), // JSON array of class IDs or "all"
  
  // Fields from Create Class form
  description: text("description"),
  categoryId: integer("category_id"),
  ageGroup: text("age_group").default("Adults"),
  
  isActive: boolean("is_active").default(true),
  status: text("status").notNull().default("enabled"), // "enabled", "disabled"
  creationDate: timestamp("creation_date").defaultNow(),
  futureClassCount: integer("future_class_count"), // Count of eligible future classes
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassPackageSchema = createInsertSchema(classPackages).pick({
  coachId: true,
  title: true,
  packageType: true,
  classCount1: true,
  classCount2: true,
  classCount3: true,
  price1: true,
  price2: true,
  price3: true,
  eligibleClasses: true,
  description: true,
  categoryId: true,
  ageGroup: true,
  isActive: true,
  status: true,
});

export type InsertClassPackage = z.infer<typeof insertClassPackageSchema>;
export type ClassPackage = typeof classPackages.$inferSelect;

// Package Purchases
export const packagePurchases = pgTable("package_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  packageId: integer("package_id").notNull(),
  packageType: text("package_type").notNull(), // 'time_bound' or 'set_pack'
  classCount: integer("class_count").notNull(), // Number of classes purchased
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), // Amount paid in dollars
  currency: text("currency").notNull().default("usd"),
  paymentIntentId: text("payment_intent_id"),
  paymentMethod: text("payment_method"), // stripe, paypal, etc.
  purchaseDate: timestamp("purchase_date").defaultNow(),
  paymentStatus: text("payment_status").notNull().default("pending"), // 'completed', 'pending', 'refunded'
  stripeFee: numeric("stripe_fee", { precision: 10, scale: 2 }).notNull().default('0.00'), // Stripe processing fee in dollars
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(), // Amount after Stripe fees in dollars
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }).notNull().default('0.00'), // Platform fee (15%) in dollars
  firstProviderPayout: numeric("first_provider_payout", { precision: 10, scale: 2 }).notNull().default('0.00'), // 25% of total provider payout in dollars
  firstProviderPayoutStatus: text("first_provider_payout_status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  payoutDate: timestamp("payout_date"),
  usedClasses: integer("used_classes").notNull().default(0), // Classes completed by user
  remainingClasses: integer("remaining_classes").notNull(), // Classes left to use
  expirationDate: timestamp("expiration_date"), // Calculated or manually set
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPackagePurchaseSchema = createInsertSchema(packagePurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPackagePurchase = z.infer<typeof insertPackagePurchaseSchema>;
export type PackagePurchase = typeof packagePurchases.$inferSelect;

// Package Bookings - Tracks when package purchases are used for specific bookings
export const packageBookings = pgTable("package_bookings", {
  id: serial("id").primaryKey(),
  packagePurchaseId: integer("package_purchase_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  bookingDate: timestamp("booking_date").notNull(), // When the booking was made
  classDate: timestamp("class_date").notNull(), // When the actual class is
  status: text("status").notNull().default("confirmed"), // 'confirmed', 'cancelled', 'completed', 'no-show'
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"), // When the package class was actually used
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPackageBookingSchema = createInsertSchema(packageBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPackageBooking = z.infer<typeof insertPackageBookingSchema>;
export type PackageBooking = typeof packageBookings.$inferSelect;

// Class Instances - Actual scheduled instances of classes
export const classInstances = pgTable("class_instances", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(), // FK to classes table
  instanceDate: text("instance_date").notNull(), // Date in YYYY-MM-DD format
  startTime: text("start_time").notNull(), // Time in HH:MM format
  endTime: text("end_time").notNull(), // Time in HH:MM format
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'cancelled', 'completed'
  capacityOverride: integer("capacity_override"), // Override class capacity for this instance
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassInstanceSchema = createInsertSchema(classInstances).omit({
  id: true,
  createdAt: true,
});

export type InsertClassInstance = z.infer<typeof insertClassInstanceSchema>;
export type ClassInstance = typeof classInstances.$inferSelect;
