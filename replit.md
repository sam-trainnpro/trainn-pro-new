# Trainn Fitness Marketplace

## Overview

Trainn is a full-stack fitness marketplace application that connects fitness coaches with customers for booking local outdoor workouts and sports classes. The platform enables coaches to create and manage fitness classes while providing customers with an easy-to-use booking system with integrated payments through Stripe.

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
- Email confirmations for successful bookings
- Cancellation policy management
- Booking history and status tracking
- Direct confirmed booking creation (no pending status)

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
- June 20, 2025. Completed customer review system implementation with star ratings and text reviews for past bookings
- June 19, 2025. Eliminated pending booking status - bookings only created after successful payment completion
- June 18, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```