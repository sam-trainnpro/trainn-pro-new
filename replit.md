# Trainn Fitness Marketplace

## Overview

Trainn is a full-stack fitness and creative activity marketplace application that connects fitness coaches with customers for booking local outdoor workouts and sports classes. The platform enables coaches to create and manage fitness classes while providing customers with an easy-to-use booking system with integrated payments through Stripe.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **UI Components**: Radix UI primitives with custom styling
- **Maps Integration**: Google Maps API via @react-google-maps/api
- **Payment Processing**: Stripe React integration (@stripe/react-stripe-js)

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: Passport.js with local strategy and express-session
- **Database**: PostgreSQL with Drizzle ORM
- **Email**: SendGrid for transactional emails
- **File Uploads**: Multer for handling image uploads
- **Payment Processing**: Stripe server-side SDK

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema**: Centralized in `/shared/schema.ts` with type-safe operations
- **Key Tables**: users, classes, bookings, reviews, class_categories, class_schedules, contact_messages, password_reset_tokens

## Key Components

### Authentication System
- Role-based access control (customer, coach, admin)
- Secure password hashing using Node.js crypto (scrypt)
- Session-based authentication with PostgreSQL session store
- Coach approval workflow for business verification

### Class Management
- Coaches can create, edit, and manage fitness classes
- Support for recurring classes with schedules
- Location-based search with Google Maps integration
- Category-based class organization
- Image upload capabilities for class promotional materials

### Booking System
- Real-time availability checking
- Stripe integration for secure payment processing
- Free class booking system for $0 classes (bypasses payment)
- Email confirmations for successful bookings
- Cancellation policy management
- Booking history and status tracking
- Direct confirmed booking creation (no pending status)
- Aggressive cache refresh for immediate booking visibility

### Review System
- Customer review functionality for past bookings
- 5-star rating system with optional text comments
- Review editing capabilities with updated_at timestamps
- Integration with My Bookings page (Add/View Review buttons)
- Review validation preventing duplicate reviews per booking
- Proper authentication and ownership verification

### Payment Processing
- Stripe Connect for coach payouts (infrastructure in place)
- Customer payment processing via Stripe Payment Intents
- Automatic email receipts via SendGrid
- Refund handling capabilities

### Location Services
- Google Maps integration for address autocomplete
- Interactive map views for class locations
- Geolocation-based search functionality
- Location preview components

## Data Flow

1. **User Registration/Login**: Users register with role selection → Authentication via Passport.js → Session creation
2. **Class Creation**: Coaches create classes → Location geocoding → Database storage → Available for booking
3. **Class Discovery**: Customers search/filter classes → Map or list view → Class details page
4. **Booking Process**: Customer selects class → Stripe payment processing → Booking confirmation → Email notifications
5. **Class Management**: Coaches view bookings → Manage class schedules → Edit class details

## External Dependencies

### Required Services
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Email**: SendGrid (SENDGRID_API_KEY required)
- **Maps**: Google Maps JavaScript API (Google Maps API key needed)
- **Payments**: Stripe (STRIPE_SECRET_KEY and VITE_STRIPE_PUBLISHABLE_KEY required)
- **Image Storage**: Cloudinary (CLOUDINARY_URL required)

### Environment Variables
- DATABASE_URL: PostgreSQL connection string
- SENDGRID_API_KEY: Email service authentication
- SESSION_SECRET: Session encryption key
- STRIPE_SECRET_KEY: Server-side Stripe authentication
- VITE_STRIPE_PUBLISHABLE_KEY: Client-side Stripe public key
- CLOUDINARY_URL: Cloudinary connection string (format: cloudinary://api_key:api_secret@cloud_name)
- Google Maps API key (for client-side integration)

## Deployment Strategy

### Development
- Vite dev server for hot module replacement
- Express server with middleware for API routes
- Session-based authentication for development workflow

### Production Build
- Vite builds React app to `dist/public`
- ESBuild bundles Express server to `dist/index.js`
- Static file serving from build output
- Session store persisted in PostgreSQL

### Replit Configuration
- Configured for Node.js 20 with PostgreSQL 16
- Automatic deployment to Replit's autoscale infrastructure
- Port 5000 mapped to external port 80
- Build command: `npm run build`
- Run command: `npm run start`

## Changelog

```
Changelog:
- July 17, 2025. Enhanced category filtering with future classes only - created new API endpoint /api/categories/with-future-classes that returns only class categories with upcoming classes; updated SearchFilters component to accept showOnlyFutureCategories prop; applied filtered categories to both home page and Browse All Classes page for cleaner customer experience while maintaining full category list for coach Create Class functionality
- July 16, 2025. Updated Stripe revenue split calculation to properly handle transaction fees - implemented 85% coach / 15% platform split AFTER deducting Stripe fees (2.9% + $0.30 per transaction) instead of before; updated payment intent metadata to track all fee components (stripeFee, netAmount, platformFee, coachPayout) for better financial reporting
- July 16, 2025. Updated hero image on home page to new multi-panel composition with white background and improved layout - uploaded Hero Images - Trainn Home Page v3 using Cloudinary's crop: 'pad' with white background; adjusted layout to position buttons in grey gradient area for better image visibility; optimized spacing to 3 paragraph spaces between text and buttons for iPhone SE compatibility; aligned text to top of hero section to prevent title cutoff
- July 16, 2025. Updated CTA section text and removed app store buttons - changed heading to "Ready to Trainn?" and updated description to emphasize upskilling and community building; removed App Store and Google Play download buttons from download section, keeping only iPhone web app instructions
- July 16, 2025. Updated Sophia L. testimonial to emphasize strength classes and family benefits - changed from yoga focus to strength classes, added mention of finding sports classes for kids after school and weekends
- July 16, 2025. Updated all Coach Pat's soccer classes to use Cloudinary image - replaced local upload images with optimized Cloudinary URL (Kids_Soccer_-_Ball_and_Cleat_fejyih.jpg) for consistent image display across all future soccer classes
- July 16, 2025. Enhanced Featured Classes section with specific category prioritization - shows paid Strength & Conditioning class, Music class (prioritizing coaches other than Coach ID 1), and Soccer/Basketball class; fallback to Strength & Conditioning, Soccer, Basketball if no Music classes available
- July 16, 2025. Updated How Trainn Works section text - changed button to "Start Your Journey", updated descriptions to mention "adults or kids class", simplified Book & Pay text, changed final step to "Trainn & Review" emphasizing fun and goal achievement
- July 16, 2025. Streamlined home page layout by removing Top Coaches and Explore Class Types sections and moving How Trainn Works section above Featured Classes - simplified user journey to focus on core value proposition before showing available classes
- July 16, 2025. Updated hero section background image to zoomed-out family workout photo - uploaded custom family workout image to Cloudinary with wider composition showing outdoor fitness activities with adults and kids, better representing the platform's focus on diverse class offerings for all ages
- July 16, 2025. Created backup copy of home page at client/src/pages/home-backup.tsx - preserved original layout structure with all sections for reference before making layout changes, not accessible to end users
- July 16, 2025. Added How Trainn Works section to About Us page - copied the 3-step process (Find Your Class, Book & Pay, Get Fit & Review) from home page and positioned it above the 4 pillars boxes and below the text description, maintaining consistent styling and functionality
- July 16, 2025. Fixed home page redirect issue - disabled automatic search trigger in SearchFilters component that was causing 100ms delayed redirect to /classes page after home page load, allowing users to view the complete homepage experience with hero section, search filters, featured classes, featured coaches, class categories, how it works, download app, testimonials, and CTA section
- July 16, 2025. Enhanced Create Account form with legal document links - updated Terms of Service and Privacy Policy links in registration form to point to /terms and /privacy respectively, replacing placeholder links for proper legal document navigation
- July 16, 2025. Enhanced Terms of Use page with additional hyperlinks - added 4 new clickable links: Gift Cards section (4b) to /terms/gifts, Refer a Friend section (4c) to /terms/customer-referrals, Community Guidelines (section 7) to /communityguidelines, and Digital Millennium Copyright Act (section 17) to /terms/dmca for comprehensive cross-document navigation
- July 16, 2025. Enhanced Terms of Use page with FAQ hyperlinks - added clickable links to "here" references in sections 3g (Other Fees) and 3h (Reservation and Cancellation) that direct users to /faq page for cancellation and missed offering rules
- July 16, 2025. Added scroll-to-top functionality to Contact Us page - users automatically scroll to top when navigating from any link (including "contacting us" link in Terms of Use)
- July 16, 2025. Enhanced Terms of Use page with contact link - added hyperlink to "contacting us" text in Section 2j (Communications) that directs users to /contact page
- July 16, 2025. Enhanced Terms of Use page with interactive Privacy Policy hyperlinks - added clickable links to Privacy Policy references in sections 1a, 1c, 6 (twice), and 8 for improved user navigation between legal documents
- July 16, 2025. Fixed AuthProvider error on legal pages by updating HeroSection component to use useSafeAuth hook instead of useAuth, ensuring legal pages load properly without authentication requirements
- July 16, 2025. Added scroll-to-top functionality for all legal pages (Terms of Use, Privacy Policy, Cookie Policy) - users automatically scroll to document beginning when navigating to legal pages
- July 16, 2025. Completed comprehensive Cookie Policy page at /cookies with detailed information about cookie usage, tracking technologies, browser controls, targeted advertising, and Do Not Track policies - added verbatim legal text covering first-party and third-party cookies, browser settings, and opt-out procedures
- July 16, 2025. Completed comprehensive Privacy Policy page at /privacy with all 12 sections including data collection practices, sharing policies, security measures, international transfers, retention policies, user rights, and special terms for US residents - added verbatim legal text covering personal information handling, third-party disclosures, and compliance with state privacy laws
- July 16, 2025. Completed comprehensive Terms of Use page at /terms with all 19 sections including platform terms, billing policies, arbitration agreement, liability limitations, and miscellaneous provisions - added verbatim legal text covering user obligations, payment processing, content rights, dispute resolution, and New York law governance
- July 16, 2025. Added DMCA policy page at /terms/dmca with comprehensive copyright infringement procedures, contact information, and legal guidelines - accessible via direct URL but not linked in main navigation as requested
- January 10, 2025. Successfully integrated Cloudinary cloud storage for permanent image hosting - all uploaded images (coach profiles, class images) now stored securely in the cloud with automatic optimization (1200x1200 max resolution, auto-format selection) and organized folder structure ('trainn' folder), includes graceful fallback to local storage if Cloudinary unavailable
- January 10, 2025. Enhanced coach pages with Google Maps-style detailed review display - shows reviewer first name, star rating, relative dates (e.g. "4 months ago"), and full comment text in clean white cards; backend now limits to 5 most recent reviews ordered by updated_at timestamp
- January 8, 2025. Eliminated all placeholder ratings (4.9 stars, 10 reviews) across the application - coaches, classes, and all components now display only authentic review data from real customers, hiding rating sections when no reviews exist
- January 8, 2025. Fixed Amazon Pay booking workflow by resolving cross-origin navigation errors - implemented proper redirect handling that routes Amazon Pay success callbacks back to checkout page for booking confirmation, eliminating runtime errors and ensuring bookings appear correctly in My Bookings page
- July 7, 2025. Increased maximum photo upload size from 5MB to 40MB for all image uploads (profile pictures and class images) across the application - updated multer configuration and UI text to reflect the new limit
- January 2, 2025. Implemented admin email notification system for new coach registrations - sends professional HTML email to sam@trainn.pro when new coaches register via standard registration or Google OAuth conversion, includes coach details, areas of expertise, and bio for admin review
- January 2, 2025. Resolved recurring Vite dependency cache corruption issues by implementing complete dependency rebuild process - fixed persistent preview loading problems that occurred multiple times during development
- January 2, 2025. Completed Age Group UI improvements - replaced duplicate "What to Bring" section on Class Detail page with Age Group display showing "Adults" or "Kids" alongside other class information
- January 2, 2025. Integrated Age Group filtering with Browse All Classes page - removed age group badges from individual class listings and added Age Group filter dropdown with proper URL parameter handling
- June 26, 2025. Fixed cache invalidation bug in class editing - corrected query key format mismatch that prevented My Calendar from showing updated data immediately after editing
- June 26, 2025. Enhanced class editing workflow - after saving changes, users are redirected to My Calendar page with auto-refreshed data to immediately see their updates in calendar view
- June 26, 2025. Fixed class editing bug causing 500 error - corrected undefined variable reference in update class route that was preventing coaches from editing class details
- June 26, 2025. Added calendar invite functionality to booking confirmation and reminder emails - customers can now click "Add to Calendar" button to automatically add booked classes to their Google Calendar with proper event details including title, description, location, and timing.
- June 26, 2025. Successfully deployed app to trainn-samuelroth.replit.app and updated Google OAuth configuration for production deployment. Fixed redirect_uri_mismatch error by updating callback URLs to use deployed domain instead of preview URL.
- June 26, 2025. Implemented complete Google OAuth "Sign In with Google" functionality - added database schema support, backend passport strategy, OAuth routes, and frontend buttons on login/register forms with role preference handling. Requires Google Cloud Console OAuth configuration with redirect URI.
- June 24, 2025. Successfully implemented complete $0 class functionality - coaches can create free classes by setting price to $0, customers can book instantly without payment processing, includes aggressive cache refresh to ensure My Bookings page shows new bookings immediately
- June 24, 2025. Completed Certifications section implementation with automatic page refresh to ensure data persistence - coaches can now successfully save and display their professional fitness certifications on their profiles
- June 24, 2025. Added Certifications section to coach profiles - coaches can now list their professional fitness certifications (NASM, ISSA, ACE Fitness, NSCA, NPTI) in a free text area within their profile settings, displayed on coach detail pages
- June 24, 2025. Implemented Areas of Expertise system for coaches - added database field, profile management interface, and display on coach cards and details pages to highlight coaching specialties
- June 24, 2025. Added six new class categories to expand activity offerings: Surfing, Dance, Music, Painting, Boxing/Martial Arts, and Baseball with professional category images from Unsplash
- June 24, 2025. Fixed password change functionality in Profile Security tab - implemented missing backend endpoint with proper password verification using correct hash format and timing-safe comparison
- June 24, 2025. Added booking warning modal system for class deletion - coaches receive warning popup when trying to delete classes with active customer bookings, featuring "Delete Anyways" (grey) and "Cancel" (green) buttons across My Calendar, My Classes, and Admin pages
- June 23, 2025. Implemented comprehensive email notification system with 7 new notification types including class reminders, cancellations, coach approvals, booking confirmations, schedule updates, welcome emails, and coach booking notifications - all emails now sent from support@trainn.pro with professional HTML templates
- June 23, 2025. Successfully implemented Google Calendar-style delete options for recurring classes with "This class" and "This and following classes" functionality working
- June 23, 2025. Implemented complete recurring class functionality with individual database rows per instance
- June 23, 2025. Updated recurring class architecture - each instance is now its own database row linked by recurringSeriesId
- June 23, 2025. Added recurringSeriesId field to allow independent management of recurring class instances
- June 23, 2025. Implemented complete recurring class functionality with Google Calendar-style recurrence modal
- June 23, 2025. Added recurrence fields to database schema and backend logic to generate multiple class instances
- June 23, 2025. Created recurring class UI with custom recurrence patterns (daily/weekly/monthly) and end conditions
- June 23, 2025. Changed mobile bottom navigation "Bookings" button to "Calendar" for coaches, directing to My Calendar page
- June 23, 2025. Added "Customers" link to mobile navigation dropdown for coaches underneath "My Classes"
- June 23, 2025. Added "My Calendar" link to mobile navigation dropdown for coaches underneath "My Classes"
- June 23, 2025. Expanded Class Image input height on Create Class page for better usability
- June 23, 2025. Expanded calendar to full card width by removing CardContent padding and calendar borders for better mobile experience
- June 23, 2025. Optimized calendar layout for mobile devices with responsive text sizes, spacing, and simplified time format
- June 23, 2025. Removed duplicate close button from class detail modal for cleaner UI
- June 23, 2025. Updated "Upcoming Classes This Month" card title to "Upcoming Classes" for cleaner UI
- June 23, 2025. Fixed calendar date alignment issue - dates now properly align with correct days of the week
- June 23, 2025. Fixed cancel button navigation in Create/Edit Class pages to use browser back navigation with fallbacks
- June 23, 2025. Enhanced duplicate functionality to pre-populate Create Class form instead of auto-creating classes
- June 23, 2025. Updated duplicate to preserve original title, category, image, and address components without "(Copy)" suffix
- June 23, 2025. Added Google Calendar-style class detail modal with edit, duplicate, and delete buttons for calendar events
- June 23, 2025. Implemented click-to-view modal system for calendar classes with action buttons and booking counts
- June 20, 2025. Implemented interactive "My Calendar" page for coaches with Google Calendar-style monthly view and class editing functionality
- June 20, 2025. Added calendar navigation with month browsing, class display on dates, and click-to-edit functionality
- June 20, 2025. Added "My Calendar" navigation link in coach dropdown menu for easy calendar access
- June 20, 2025. Fixed admin access control for customer management system - admins can now view all customer bookings with coach information
- June 20, 2025. Implemented complete customer management system for coaches and administrators
- June 20, 2025. Added Customers page with booking table sorted by class date, time, name, and customer name
- June 20, 2025. Added "Customers" navigation link in user dropdown menu for coaches and admins
- June 20, 2025. Updated password reset sender email to noreply@trainn.pro for professional branding
- June 20, 2025. Updated password reset emails to use production domain trainn.pro instead of Replit domains
- June 20, 2025. Fixed password reset email links by integrating reset form into auth page and disabling SendGrid click tracking
- June 20, 2025. Implemented complete SendGrid password reset system with email templates and secure token handling
- June 20, 2025. Completed customer review system implementation with star ratings and text reviews for past bookings
- June 19, 2025. Eliminated pending booking status - bookings only created after successful payment completion
- June 18, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```