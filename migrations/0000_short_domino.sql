CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"slug" text NOT NULL,
	"featured_image" text,
	"author_id" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tags" text[] DEFAULT '{}',
	"meta_description" text,
	"read_time" integer,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "booking_subsidies" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"promo_code_id" integer NOT NULL,
	"promo_code_usage_id" integer NOT NULL,
	"original_amount" integer NOT NULL,
	"customer_paid" integer NOT NULL,
	"subsidy_amount" integer NOT NULL,
	"coach_earnings" integer NOT NULL,
	"platform_fee" integer NOT NULL,
	"commission_rate" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_payment_id" text,
	"stripe_payment_intent_id" text,
	"stripe_transfer_id" text,
	"payment_method" text,
	"amount" integer,
	"currency" text DEFAULT 'usd',
	"platform_fee" integer,
	"coach_payout" integer,
	"payout_status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"payment_date" timestamp,
	"payout_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "class_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	CONSTRAINT "class_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "class_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"coach_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"price" real NOT NULL,
	"capacity" integer NOT NULL,
	"location" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"address" text NOT NULL,
	"street" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"image" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"is_recurring" boolean DEFAULT false,
	"parent_class_id" integer,
	"recurring_series_id" text,
	"recurrence_type" text,
	"recurrence_interval" integer,
	"recurrence_days_of_week" text,
	"recurrence_end_type" text,
	"recurrence_end_date" timestamp,
	"recurrence_end_count" integer,
	"what_to_bring" text,
	"age_group" text DEFAULT 'Adults' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "promo_code_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"promo_code_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"discount_amount" integer NOT NULL,
	"subsidy_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"coach_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"first_booking_only" boolean DEFAULT false NOT NULL,
	"minimum_quantity" integer DEFAULT 1 NOT NULL,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"platform_subsidized" boolean DEFAULT false NOT NULL,
	"commission_override" integer,
	"budget_limit" integer,
	"budget_used" integer DEFAULT 0 NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "provider_referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"provider_id" integer,
	"referral_code" text NOT NULL,
	"provider_email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_bookings_count" integer DEFAULT 0 NOT NULL,
	"qualified_at" timestamp,
	"provider_reward_granted" boolean DEFAULT false NOT NULL,
	"referrer_reward_granted" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referee_id" integer,
	"referral_code" text NOT NULL,
	"referee_email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"reward_granted" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"class_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"coach_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduled_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"class_id" integer,
	"coach_id" integer NOT NULL,
	"customer_id" integer,
	"stripe_payment_intent_id" text,
	"amount_cents" integer NOT NULL,
	"stripe_fee" integer DEFAULT 0 NOT NULL,
	"net_amount" integer NOT NULL,
	"coach_payout" integer NOT NULL,
	"platform_fee" integer DEFAULT 0 NOT NULL,
	"payout_type" text DEFAULT 'booking' NOT NULL,
	"provider_referral_id" integer,
	"scheduled_payout_date" timestamp NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"stripe_transfer_id" text,
	"completed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_commission_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tier_name" text NOT NULL,
	"commission_rate" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp,
	"assigned_by" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_commission_tiers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"description" text NOT NULL,
	"referral_id" integer,
	"booking_id" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"business_name" text,
	"display_business_name" boolean DEFAULT false,
	"phone" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"bio" text,
	"profile_image" text,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"stripe_customer_id" text,
	"stripe_connect_id" text,
	"stripe_connect_onboarded" boolean DEFAULT false,
	"bank_account_verified" boolean DEFAULT false,
	"areas_of_expertise" integer[] DEFAULT '{}',
	"certifications" text,
	"google_id" text,
	"auth_method" text DEFAULT 'password' NOT NULL,
	"google_profile_picture" text,
	"referral_code" text,
	"provider_referral_code" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code"),
	CONSTRAINT "users_provider_referral_code_unique" UNIQUE("provider_referral_code")
);
