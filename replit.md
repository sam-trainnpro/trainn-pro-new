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