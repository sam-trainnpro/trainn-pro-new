# Trainn Fitness Marketplace

## Overview
Trainn is a full-stack fitness and creative activity marketplace designed to connect fitness coaches with customers for local outdoor workouts and sports classes. It provides coaches with tools for class creation and management, while offering customers an intuitive booking system integrated with Stripe payments. The platform aims to be a comprehensive solution for discovering, booking, and managing fitness and creative activities.

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
- **Key Entities**: Users (with role-based access), Classes (with schedules, categories, locations), Bookings (with payment integration, status tracking), Reviews, Contact Messages, Password Reset Tokens.

### Core Features
- **Authentication**: Role-based access control (customer, coach, admin), secure password hashing, session-based with coach approval workflow.
- **Class Management**: Coaches create and manage classes, including recurring classes, with location-based search, category organization, and image uploads.
- **Booking System**: Real-time availability, Stripe payments (including free class booking bypass), email confirmations, cancellation policy, and booking history.
- **Review System**: Customer reviews (5-star, text comments) integrated with booking history.
- **Payment Processing**: Stripe Connect for payouts, Payment Intents for customers, automatic email receipts, and refund handling.
- **Location Services**: Google Maps integration for autocomplete, interactive maps, and geolocation search.
- **Promo Code System**: Platform-subsidized promo codes with dynamic discounts, usage limits, and integration into checkout, including automatic coach subsidy transfers.
- **Recurring Classes**: Google Calendar-style recurrence options with individual instance management.
- **Email Notifications**: Comprehensive system for bookings, reminders, cancellations, and approvals.
- **Image Hosting**: Cloudinary for permanent image storage and optimization.
- **Referral System**: Awards $5 credit to both referrer and referee after the referee's first completed paid class, with automatic credit application during checkout. Platform subsidy system ensures coaches receive full compensation when customers use credits.
- **Provider Referral System**: Complete 6-step "Refer a Provider" feature with $25 rewards. System tracks provider signups via referral codes, grants $25 Stripe payouts to providers after 3 paid bookings. For referrers: providers receive $25 Stripe payouts (since they don't book classes), while customers receive $25 account credits. All provider referrals are properly tracked in database and displayed in account balance totals.
- **Platform Subsidy Architecture**: Automated system ensuring coaches always receive full payouts (85% of original class price) even when customers use account balance credits. The platform covers the difference between reduced customer payments and full coach compensation.
- **Multi-Ticket Promo Codes**: Complete implementation allowing promo codes to require minimum ticket quantities. Includes admin management interface, coach creation/editing capabilities, checkout validation, and proper database persistence. System validates minimum requirements before applying discounts.
- **Business Name Display Options**: Providers can optionally add a business name to their profile and choose whether to display it to customers instead of their personal name. When enabled, the business name appears on provider listings, maintaining professional branding flexibility.
- **Fully Subsidized Booking Payouts**: Enhanced payout system to ensure providers receive compensation for all confirmed bookings, including those paid entirely with customer account credits. Added "fully_subsidized_booking" payout type where platform covers 100% of provider compensation (85% of class price) from Trainn Global Stripe Account, maintaining provider payment consistency regardless of customer payment method.

## SEO Strategy & Implementation Plan
*Documented: August 7, 2025 - For implementation week of August 12, 2025*

### Target Keywords & Search Intent
Primary focus on three high-value searches:
1. **"Outdoor Workout San Francisco"** - Adult fitness seekers wanting park-based classes
2. **"Drop In Sports Classes for Kids"** - Parents seeking flexible children's sports without long-term commitment
3. **"Kids Soccer Class"** - Parents specifically looking for soccer programs for children

### Current SEO Assets
- **Existing Content**: 18 soccer classes, multiple outdoor workout classes (STRONG + SCULPT, Boot Camp @ Dolores Park)
- **Technical Foundation**: Basic meta tags, sitemap.xml, robots.txt, dynamic meta tags on class/coach pages
- **URL Structure**: Supports filtering (/classes?ageGroup=Kids&category=6)

### Priority Landing Pages (To Be Built)

#### 1. `/outdoor-workouts-san-francisco`
- **Purpose**: Target "outdoor workout san francisco" searches
- **Structure**: Hero with H1 "Outdoor Fitness Classes in San Francisco's Best Parks", featured outdoor classes, location map, coach spotlights, seasonal schedules
- **Filtering Logic**: Classes with outdoor locations (parks) or outdoor-focused descriptions
- **Unique Value**: Pre-filtered outdoor-only content with location-specific details

#### 2. `/kids-drop-in-sports` 
- **Purpose**: Target "drop in sports classes for kids" searches
- **Structure**: Hero emphasizing flexibility, age group tabs, sports grid, parent benefits section, testimonials
- **Filtering Logic**: Kids classes with emphasis on drop-in flexibility
- **Unique Value**: Highlights no-commitment flexibility vs traditional seasonal leagues

#### 3. `/kids-soccer-classes-san-francisco`
- **Purpose**: Target "kids soccer class" searches  
- **Structure**: Age-specific programs, coach profiles, skills development info, location details, success stories
- **Filtering Logic**: Kids + Soccer category + San Francisco location
- **Unique Value**: Deep-dive soccer content with developmental benefits

### FAQ Schema Implementation
**What it is**: JSON-LD structured data (not the existing /faq page) that helps Google show Q&As directly in search results as rich snippets.

**Strategic Placement**:
- Homepage: "What types of classes does Trainn offer?"
- Kids Soccer page: "What age groups are soccer classes available for?"  
- Outdoor Workouts page: "Do outdoor classes run in rain?"
- Individual class pages: "What should I bring to class?"

**Example Implementation**:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage", 
  "mainEntity": [{
    "@type": "Question",
    "name": "How much are drop-in sports classes for kids?",
    "acceptedAnswer": {
      "@type": "Answer", 
      "text": "Kids drop-in sports classes range from $25-40 per session. No commitments required."
    }
  }]
}
```

### Quick Wins (Immediate Implementation)
1. **Update meta descriptions** to include target keywords
2. **Add location data to class titles** (e.g., "Kids Soccer Class (Ages 3-7) - Upper Noe Rec, San Francisco")
3. **Create keyword-rich alt text** for category images
4. **Add FAQ schema** to answer common searches

### Technical SEO Improvements
- **Structured Data**: SportsActivityLocation schema for classes
- **Local SEO**: LocalBusiness schema for locations
- **URL Structure**: Clean URLs like /kids/sports/soccer/san-francisco
- **Breadcrumbs**: Schema markup for better SERP display

### Implementation Timeline
- **Week 1-2**: Quick wins → 10-15% visibility increase
- **Month 1**: Landing pages live → Target keywords enter top 20  
- **Month 2-3**: Full schema implementation → Rich snippets appear
- **Month 3-6**: Authority building → Top 10 rankings

### Current Content Analysis
- **Soccer Classes**: 18 total classes in system, primarily ages 3-7 at Upper Noe Recreation Center
- **Outdoor Classes**: STRONG + SCULPT (Bayfront Park), Boot Camp @ Dolores Park, Sunday Soul Flow (Baker Beach)
- **Target Locations**: Dolores Park, Bayfront Park, Baker Beach, Upper Noe Rec, Mission Playground

## External Dependencies

- **Database**: PostgreSQL
- **Email Service**: SendGrid
- **Mapping Service**: Google Maps JavaScript API
- **Payment Gateway**: Stripe
- **Cloud Storage**: Cloudinary