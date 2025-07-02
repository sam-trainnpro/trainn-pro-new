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

### Environment Variables
- DATABASE_URL: PostgreSQL connection string
- SENDGRID_API_KEY: Email service authentication
- SESSION_SECRET: Session encryption key
- STRIPE_SECRET_KEY: Server-side Stripe authentication
- VITE_STRIPE_PUBLISHABLE_KEY: Client-side Stripe public key
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