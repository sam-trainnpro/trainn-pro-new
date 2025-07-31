# Trainn Fitness Marketplace

## Overview
Trainn is a full-stack fitness and creative activity marketplace connecting fitness coaches with customers for booking local outdoor workouts and sports classes. It provides coaches with class creation and management tools, and customers with an easy-to-use booking system featuring Stripe payments. The platform aims to be a comprehensive solution for fitness and activity discovery, booking, and management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui and Radix UI
- **Maps Integration**: Google Maps API
- **Payment Integration**: Stripe React

### Backend
- **Runtime**: Node.js with Express.js
- **Authentication**: Passport.js (local strategy, express-session)
- **Database**: PostgreSQL with Drizzle ORM
- **Email**: SendGrid
- **File Uploads**: Multer
- **Payment Processing**: Stripe server-side SDK

### Database Design
- **ORM**: Drizzle (PostgreSQL dialect)
- **Schema**: Centralized and type-safe
- **Key Entities**: Users (with role-based access), Classes (with schedules, categories, locations), Bookings (with payment integration, status tracking), Reviews, Contact Messages, Password Reset Tokens.

### Core Features
- **Authentication**: Role-based access control (customer, coach, admin), secure password hashing, session-based. Coach approval workflow.
- **Class Management**: Coaches create/manage classes, recurring classes, location-based search, category organization, image uploads.
- **Booking System**: Real-time availability, Stripe payments (including free class booking bypass), email confirmations, cancellation policy, booking history.
- **Review System**: Customer reviews (5-star, text comments), review editing, integration with booking history.
- **Payment Processing**: Stripe Connect for payouts, Payment Intents for customers, automatic email receipts, refund handling.
- **Location Services**: Google Maps integration (autocomplete, interactive maps, geolocation search).
- **Promo Code System**: Platform-subsidized promo codes with dynamic discounts, usage limits, and integration into the checkout flow with automatic coach subsidy transfers. Admin and coach management interfaces.
- **Recurring Classes**: Google Calendar-style recurrence options with individual instance management.
- **Email Notifications**: Comprehensive system for bookings, reminders, cancellations, approvals, etc.
- **Image Hosting**: Cloudinary for permanent image storage and optimization.

## External Dependencies

- **Database**: PostgreSQL
- **Email Service**: SendGrid
- **Mapping Service**: Google Maps JavaScript API
- **Payment Gateway**: Stripe
- **Cloud Storage**: Cloudinary

## Recent Changes & Business Policies

### Legal Entity Updates
- Updated all legal documents (terms, privacy, cookies) to reference "Trainn Global, LLC"
- Changed cancellation policy from 48 hours to 24 hours notice requirement

### UI Improvements
- Cleaned up admin navigation by removing redundant "All Customers" link from menu

## Implementation History

### Promo Code System (Completed)

**✅ COMPREHENSIVE PROMO CODE MANAGEMENT SYSTEM**

The platform now features a complete promo code system with sophisticated discount capabilities, coach management, and admin oversight.

**Core Features Implemented:**
- **Admin Promo Code Management**: Full CRUD operations with approval workflows
- **Coach Promo Code Creation**: Self-service creation with admin approval process  
- **Platform-Subsidized Discounts**: Codes where platform covers discount to maintain coach earnings
- **Usage Analytics**: Detailed tracking of code performance and usage statistics
- **Budget Controls**: Platform subsidy budget limits with real-time tracking
- **Multiple Discount Types**: Percentage and fixed-amount discounts with validation

**Advanced Capabilities:**
- **Coach-Specific Codes**: Promo codes that only work for specific coaches' classes
- **First Booking Only**: New customer acquisition codes with validation
- **Usage Limits**: Global usage caps across all customers
- **Commission Overrides**: Ability to reduce platform commission for promotional periods
- **Approval Workflows**: Email notifications for pending approvals and status changes

**✅ PLATFORM SUBSIDY TRANSFERS**

The system now fully implements platform subsidy transfers to coaches.

**Complete Money Flow Implementation:**
1. Customer uses platform-subsidized promo code (e.g., SAVE20% on $25 class)  ✅ Working
2. Customer pays discounted amount ($20)  ✅ Working
3. System records $5 platform subsidy in database  ✅ Working
4. **✅ IMPLEMENTED**: Platform automatically transfers $5 to coach's Stripe account
5. Coach receives total of $25 (their normal earnings maintained through platform subsidy)
6. Platform covers the discount difference to ensure coaches aren't penalized

**Implementation Details:**
- Enhanced `server/payout-processor.ts` with platform subsidy integration
- Added `getPlatformSubsidyForBooking()` storage method for subsidy lookup
- Modified payout calculation to include subsidy amounts on top of customer payment portions
- Integrated Stripe transfer logic for platform subsidy funds to coach connected accounts
- Comprehensive financial tracking with detailed logging and metadata
- Enhanced transfer descriptions and metadata for accounting transparency

**Technical Features:**
- Automatic subsidy detection and inclusion in coach payouts
- Detailed logging showing base payout + subsidy breakdown
- Enhanced Stripe transfer metadata tracking all financial components
- Zero-impact on existing non-subsidized bookings and payouts

### Future Enhancements (Planned)

**Dynamic Commission Rates:**
- Promo code commission overrides: Reduce platform commission (15% → 5% or 0%)
- User tier system: VIP/Partner/Influencer rates with `user_commission_tiers` table
- Strategic use cases: Coach acquisition, customer retention, partnership deals

This system enables sophisticated promotional strategies once the platform subsidy transfer functionality is completed.

## Refer a Friend Feature (Planned)

### Feature Overview
A referral system providing $5 account credits to both referrer and referee after the referee completes their first paid class.

### Key Requirements Discussed
- **Reward Structure**: $5 credit to both parties
- **Timing**: Referrer gets reward AFTER referee completes first class (not just books)
- **Usage**: Multiple referrals allowed per user
- **Format**: Account credits (not promo codes) - stored in new `user_credits` table
- **Budget Cap**: $2000 max (adjustable in code)
- **Expiration**: Referral links expire after 60 days

### Technical Architecture Planned

**Database Schema:**
- `referrals` table: Track referral relationships, codes, status, expiration
- `user_credits` table: Transaction-based credit system with audit trail
- Integration with existing promo code infrastructure

**Credit System Design:**
- Transaction-based credits (positive/negative entries)
- Complete audit trail of credit sources and usage
- Integration with checkout flow (similar to promo codes)
- Support for partial credit usage and stacking with other discounts

**Anti-Fraud Measures:**
- Email uniqueness validation
- IP tracking for self-referral prevention
- Must be first paid booking (excludes $0 classes)
- Referral code expiration enforcement

**User Experience:**
- Referral dashboard in user profile
- Share functionality (email, SMS, WhatsApp)
- Credit balance display in profile and checkout
- Automatic referral code detection during signup

### Integration Points
- Leverage existing SendGrid email system for notifications
- Use existing payment flow with credit application
- Build on current promo code discount logic
- Integrate with booking completion triggers

### Future Considerations
- Analytics dashboard for referral performance
- Admin panel for budget monitoring
- Credit expiration policies
- Additional credit sources (loyalty, compensation)

## User Preferences

Preferred communication style: Simple, everyday language.