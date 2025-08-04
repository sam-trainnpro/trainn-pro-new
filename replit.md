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
- **Platform Subsidy Architecture**: Automated system ensuring coaches always receive full payouts (85% of original class price) even when customers use account balance credits. The platform covers the difference between reduced customer payments and full coach compensation.

## External Dependencies

- **Database**: PostgreSQL
- **Email Service**: SendGrid
- **Mapping Service**: Google Maps JavaScript API
- **Payment Gateway**: Stripe
- **Cloud Storage**: Cloudinary