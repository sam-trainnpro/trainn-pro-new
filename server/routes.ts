import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { db } from "./db";
import { classes, users } from "../shared/schema";

// Map US states to their IANA timezone identifiers
function getTimezoneForState(state: string | null): string {
  if (!state) return 'America/Los_Angeles'; // Default to Pacific
  
  const stateUpper = state.toUpperCase();
  
  // Eastern Time (UTC-5/UTC-4)
  const easternStates = ['CT', 'DE', 'FL', 'GA', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'NC', 'OH', 'PA', 'RI', 'SC', 'VT', 'VA', 'WV', 'DC'];
  // Central Time (UTC-6/UTC-5)
  const centralStates = ['AL', 'AR', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'MN', 'MS', 'MO', 'NE', 'ND', 'OK', 'SD', 'TN', 'TX', 'WI'];
  // Mountain Time (UTC-7/UTC-6)
  const mountainStates = ['AZ', 'CO', 'ID', 'MT', 'NM', 'UT', 'WY'];
  // Pacific Time (UTC-8/UTC-7)
  const pacificStates = ['CA', 'NV', 'OR', 'WA'];
  // Alaska Time (UTC-9/UTC-8)
  const alaskaStates = ['AK'];
  // Hawaii Time (UTC-10)
  const hawaiiStates = ['HI'];
  
  if (easternStates.includes(stateUpper)) return 'America/New_York';
  if (centralStates.includes(stateUpper)) return 'America/Chicago';
  if (mountainStates.includes(stateUpper)) return 'America/Denver';
  if (pacificStates.includes(stateUpper)) return 'America/Los_Angeles';
  if (alaskaStates.includes(stateUpper)) return 'America/Anchorage';
  if (hawaiiStates.includes(stateUpper)) return 'America/Honolulu';
  
  // Default to Pacific if unknown
  return 'America/Los_Angeles';
}
import { 
  sendBookingConfirmation, 
  sendNewBookingNotificationToCoach, 
  sendWelcomeEmail,
  sendCoachApprovalNotification,
  sendBookingCancellationConfirmation,
  sendPromoCodeApprovalRequest,
  sendPromoCodeApprovalEmail,
  sendPromoCodeRejectionEmail,
  sendBookingAdminNotification,
  sendPackagePurchaseConfirmation,
  sendPackagePurchaseNotification
} from "./email";
import { 
  sendClassCancellationNotifications,
  sendClassUpdateNotifications,
  sendDailyClassReminders
} from "./email-scheduler";
import { z } from "zod";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";
// Import Cloudinary dynamically to avoid configuration errors at startup

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe if secret key is available
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" }) : null;

// Check if Cloudinary is available
const cloudinaryAvailable = !!process.env.CLOUDINARY_URL;
if (!cloudinaryAvailable) {
  console.warn('⚠️  CLOUDINARY_URL not found. Image uploads will use local storage (not recommended for production).');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist (fallback for local storage)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer storage - use Cloudinary if available, otherwise local disk
  let storage_multer;
  let cloudinaryEnabled = false;
  
  if (cloudinaryAvailable) {
    try {
      // Dynamic import of Cloudinary to avoid configuration errors at startup
      const { v2: cloudinary } = await import('cloudinary');
      const { CloudinaryStorage } = await import('multer-storage-cloudinary');
      
      cloudinary.config({
        secure: true, // Always use HTTPS
        folder: 'trainn' // Organize uploads in a folder
      });
      
      storage_multer = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: 'trainn', // Organize uploads in a folder
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          transformation: [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }, // Optimize images
            { fetch_format: 'auto' } // Auto-select best format
          ]
        } as any
      });
      cloudinaryEnabled = true;
      console.log('✅ Cloudinary configured successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Cloudinary storage:', error);
      console.warn('⚠️  Falling back to local storage.');
      storage_multer = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          // Generate unique filename with timestamp
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
      });
    }
  } else {
    storage_multer = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });
  }

  const upload = multer({ 
    storage: storage_multer,
    limits: {
      fileSize: 40 * 1024 * 1024 // 40MB limit
    },
    fileFilter: (req, file, cb) => {
      // Only allow image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // Serve uploaded files statically (only needed for local storage)
  if (!cloudinaryEnabled) {
    app.use('/uploads', express.static(uploadsDir));
  }

  // Public rating statistics endpoints (before authentication)
  app.get("/api/reviews/class/:classId/stats", async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const stats = await storage.getClassRatingStats(classId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching class rating stats:", error);
      res.status(500).json({ error: "Failed to fetch rating stats" });
    }
  });

  app.get("/api/reviews/coach/:coachId/stats", async (req, res) => {
    try {
      const coachId = parseInt(req.params.coachId);
      const stats = await storage.getCoachRatingStats(coachId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching coach rating stats:", error);
      res.status(500).json({ error: "Failed to fetch rating stats" });
    }
  });

  // Password reset request endpoint (public)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
      }

      // Generate reset token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
      });

      // Send reset email
      const { sendPasswordResetEmail } = await import('./email');
      const emailSent = await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName
      );

      if (!emailSent) {
        console.error('Failed to send password reset email');
        return res.status(500).json({ message: "Failed to send password reset email" });
      }

      res.json({ message: "If an account exists with this email, you will receive a password reset link." });
    } catch (error: any) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reset password endpoint (public)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Get reset token
      const resetTokenData = await storage.getPasswordResetToken(token);
      if (!resetTokenData) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > resetTokenData.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Check if token has been used
      if (resetTokenData.usedAt) {
        return res.status(400).json({ message: "Reset token has already been used" });
      }

      // Hash new password
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(resetTokenData.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Test endpoint to check OAuth configuration
  app.get('/api/auth/google/test', (req, res) => {
    const config = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
      callbackUrl: `https://trainn.pro/api/auth/google/callback`,
      domain: process.env.REPLIT_DOMAINS?.split(',')[0],
      status: 'APIs enabled - ready for testing'
    };
    res.json(config);
  });

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('Google OAuth route hit with query:', req.query);
    console.log('Request host:', req.get('host'));
    console.log('Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    const { role, redirect } = req.query;
    // Store role, redirect URL, and origin domain in state
    const host = req.get('host');
    const stateData = {
      role: role as string | undefined,
      redirect: redirect as string | undefined,
      origin: host?.includes('trainn.pro') ? 'trainn.pro' : 'replit'
    };
    const state = JSON.stringify(stateData);
    
    // Override the callback URL based on the current domain
    // Always prioritize trainn.pro for production
    const callbackURL = host?.includes('trainn.pro') || !process.env.REPLIT_DOMAINS
      ? 'https://trainn.pro/api/auth/google/callback'
      : `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
    
    console.log('Using callback URL:', callbackURL);
    
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state,
      accessType: 'offline',
      prompt: 'select_account',
      callbackURL // Override the callback URL dynamically
    })(req, res, next);
  });

  app.get('/api/auth/google/callback', 
    (req, res, next) => {
      console.log('Google callback hit with query:', req.query);
      console.log('Google callback state:', req.query.state);
      console.log('Request host:', req.get('host'));
      
      // Determine base URL from state or request
      // Default to production domain unless explicitly in Replit environment
      let baseUrl = 'https://trainn.pro';
      const host = req.get('host');
      
      if (process.env.REPLIT_DOMAINS && host?.includes(process.env.REPLIT_DOMAINS)) {
        baseUrl = `https://${process.env.REPLIT_DOMAINS}`;
      } else if (req.query.state) {
        try {
          const stateData = JSON.parse(req.query.state as string);
          if (stateData.origin === 'replit' && process.env.REPLIT_DOMAINS) {
            baseUrl = `https://${process.env.REPLIT_DOMAINS}`;
          }
        } catch (e) {
          console.log('State parsing failed, using default production domain');
        }
      }
      
      passport.authenticate('google', { 
        failureRedirect: `${baseUrl}/auth?error=google_auth_failed`,
        failureMessage: true 
      })(req, res, next);
    },
    async (req, res) => {
      // Parse state to get origin domain
      // Default to production domain
      let baseUrl = 'https://trainn.pro';
      let role: string | undefined;
      let redirectUrl: string | undefined;
      
      try {
        console.log('Google callback success, user:', req.user ? 'found' : 'not found');
        const user = req.user;
        if (!user) {
          return res.redirect(`${baseUrl}/auth?error=no_user`);
        }
        
        // Parse state to get origin and role
        const state = req.query.state;
        if (state && typeof state === 'string') {
          try {
            const stateData = JSON.parse(state);
            // Only use Replit domain if explicitly specified and available
            if (stateData.origin === 'replit' && process.env.REPLIT_DOMAINS) {
              baseUrl = `https://${process.env.REPLIT_DOMAINS}`;
            }
            role = stateData.role;
            redirectUrl = stateData.redirect;
            
            // Handle role preference
            if (role && role === 'coach' && user.role === 'customer') {
              // Update user role to coach if they selected coach during Google sign-in
              await storage.updateUser(user.id, { role: 'coach' });
              
              // Send admin notification for new coach conversion
              try {
                const { sendNewCoachNotificationToAdmin } = await import('./email');
                const updatedUser = await storage.getUser(user.id);
                if (updatedUser) {
                  await sendNewCoachNotificationToAdmin(updatedUser);
                  console.log('Admin notification sent for OAuth coach conversion:', user.email);
                }
              } catch (emailError) {
                console.error('Failed to send admin notification for OAuth coach conversion:', emailError);
                // Don't fail the OAuth process if email fails
              }
            }
          } catch (e) {
            console.error('Error parsing OAuth state:', e);
          }
        }

        // Redirect to intended destination or home page on successful authentication
        const finalRedirectUrl = redirectUrl && redirectUrl !== '/' ? `${baseUrl}${redirectUrl}` : baseUrl;
        res.redirect(finalRedirectUrl);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${baseUrl}/auth?error=callback_error`);
      }
    }
  );

  // Helper to check authentication
  function requireAuth(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }

  // Helper to check admin role
  function requireAdmin(req: any, res: any, next: any) {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  }

  // Helper to check coach role
  function requireCoach(req: any, res: any, next: any) {
    if (!req.isAuthenticated() || req.user.role !== "coach") {
      return res.status(403).json({ message: "Coach access required" });
    }
    
    // Also check if coach is approved
    if (!req.user.isApproved) {
      return res.status(403).json({ message: "Your coach account is pending approval" });
    }
    
    next();
  }

  // Get all class categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllClassCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get categories that have future classes (for customer filtering) - must come before /:id route
  app.get("/api/categories/with-future-classes", async (req, res) => {
    try {
      const categories = await storage.getCategoriesWithFutureClasses();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories with future classes:", error);
      res.status(500).json({ message: "Failed to fetch categories with future classes" });
    }
  });
  
  // Get category by ID
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getClassCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Get all cities where classes are offered
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getClassCities();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // Get all classes with consolidated data (eliminates N+1 queries)
  app.get("/api/classes", async (req, res) => {
    try {
      // Check if legacy includeSchedules parameter is used (backward compatibility)
      const includeSchedules = req.query.includeSchedules === 'true';
      
      if (includeSchedules) {
        // Fallback to legacy method for backward compatibility
        const classesWithSchedules = await storage.getClassesWithSchedules();
        const filteredClasses = applyClassFilters(classesWithSchedules, req.query);
        res.json(filteredClasses);
      } else {
        // Use optimized consolidated method with database-level filtering
        const filters = {
          categoryId: req.query.category ? Number(req.query.category) : req.query.type ? Number(req.query.type) : undefined,
          ageGroup: req.query.ageGroup as string,
          city: req.query.city as string,
          outdoors: req.query.outdoors === "Yes" ? true : req.query.outdoors === "No" ? false : undefined,
          coachId: req.query.coachId ? Number(req.query.coachId) : undefined,
          searchQuery: req.query.q as string,
          dateFilter: req.query.date ? new Date(req.query.date as string) : undefined,
          packageClasses: req.query.packageClasses as string,
          limit: 100, // Default pagination limit
          offset: 0
        };

        // Remove undefined values
        Object.keys(filters).forEach(key => {
          if (filters[key] === undefined) delete filters[key];
        });

        console.log("Database filtering with params:", filters);
        
        const classes = await storage.getClassesWithAllData(filters);
        res.json(classes);
      }
    } catch (error) {
      console.error("Error in /api/classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Helper function to apply filters to consolidated class data
  function applyConsolidatedClassFilters(classes: any[], query: any) {
    return classes.filter(classItem => {
      // Filter by coach ID
      if (query.coachId) {
        const coachId = Number(query.coachId);
        if (!isNaN(coachId) && classItem.coach.id !== coachId) {
          return false;
        }
      }
      
      // Filter by package classes
      if (query.packageClasses) {
        const packageClassIds = (query.packageClasses as string).split(',').map(id => id.trim());
        const matchesPackageClasses = packageClassIds.some(packageClassId => {
          if (packageClassId.startsWith('series_')) {
            return classItem.recurringSeriesId === packageClassId;
          } else {
            return classItem.id === Number(packageClassId);
          }
        });
        if (!matchesPackageClasses) {
          return false;
        }
      }
      
      // Text search filter
      if (query.q) {
        const searchQuery = (query.q as string).toLowerCase();
        if (!classItem.title.toLowerCase().includes(searchQuery) &&
            !classItem.description.toLowerCase().includes(searchQuery)) {
          return false;
        }
      }
      
      // Category filter (using type parameter for backward compatibility)
      if (query.category || query.type) {
        const categoryId = Number(query.category || query.type);
        if (!isNaN(categoryId) && classItem.category.id !== categoryId) {
          return false;
        }
      }
      
      // Age group filter - include "Both" classes when filtering by Adults or Kids
      if (query.ageGroup) {
        const matchesAgeGroup = classItem.ageGroup === query.ageGroup || classItem.ageGroup === 'Both';
        if (!matchesAgeGroup) {
          return false;
        }
      }
      
      // City filter
      if (query.city) {
        const cityQuery = (query.city as string).toLowerCase();
        if (!classItem.city || !classItem.city.toLowerCase().includes(cityQuery)) {
          return false;
        }
      }
      
      // Outdoors filter
      if (query.outdoors) {
        const outdoorsBool = query.outdoors === "Yes";
        if (classItem.outdoors !== outdoorsBool) {
          return false;
        }
      }
      
      // Date filter
      if (query.date) {
        if (!classItem.startTime) {
          return false;
        }
        
        const filterDate = new Date(query.date as string);
        filterDate.setHours(0, 0, 0, 0);
        
        const classDate = new Date(classItem.startTime);
        classDate.setHours(0, 0, 0, 0);
        
        if (filterDate.getTime() !== classDate.getTime()) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Helper function to apply filters to legacy class data (for backward compatibility)
  function applyClassFilters(classes: any[], query: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return classes.filter(classItem => {
      // Filter by coach ID
      if (query.coachId) {
        const coachId = Number(query.coachId);
        if (!isNaN(coachId) && classItem.coachId !== coachId) {
          return false;
        }
      }
      
      // Filter by package classes
      if (query.packageClasses) {
        const packageClassIds = (query.packageClasses as string).split(',').map(id => id.trim());
        const matchesPackageClasses = packageClassIds.some(packageClassId => {
          if (packageClassId.startsWith('series_')) {
            return classItem.recurringSeriesId === packageClassId;
          } else {
            return classItem.id === Number(packageClassId);
          }
        });
        if (!matchesPackageClasses) {
          return false;
        }
      }
      
      // Filter out past classes (only show future classes)
      if (classItem.startTime) {
        const classDate = new Date(classItem.startTime);
        if (classDate < today) {
          return false;
        }
      }
      
      // Text search filter
      if (query.q) {
        const searchQuery = (query.q as string).toLowerCase();
        if (!classItem.title.toLowerCase().includes(searchQuery) &&
            !classItem.description.toLowerCase().includes(searchQuery)) {
          return false;
        }
      }
      
      // Category filter
      if (query.category) {
        const categoryId = Number(query.category);
        if (!isNaN(categoryId) && classItem.categoryId !== categoryId) {
          return false;
        }
      }
      
      // Age group filter - include "Both" classes when filtering by Adults or Kids
      if (query.ageGroup) {
        const matchesAgeGroup = classItem.ageGroup === query.ageGroup || classItem.ageGroup === 'Both';
        if (!matchesAgeGroup) {
          return false;
        }
      }
      
      // City filter
      if (query.city) {
        const cityQuery = (query.city as string).toLowerCase();
        if (!classItem.city || !classItem.city.toLowerCase().includes(cityQuery)) {
          return false;
        }
      }
      
      // Outdoors filter
      if (query.outdoors) {
        const outdoorsBool = query.outdoors === "Yes";
        if (classItem.outdoors !== outdoorsBool) {
          return false;
        }
      }
      
      // Date filter
      if (query.date) {
        if (!classItem.startTime) {
          return false;
        }
        
        const filterDate = new Date(query.date as string);
        filterDate.setHours(0, 0, 0, 0);
        
        const classDate = new Date(classItem.startTime);
        classDate.setHours(0, 0, 0, 0);
        
        if (filterDate.getTime() !== classDate.getTime()) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Get book again recommendations for authenticated users
  app.get("/api/classes/book-again", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as User).id;
      const recommendations = await storage.getBookAgainRecommendations(userId);
      
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error getting book again recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Get class by ID
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      // Check if we want to include schedules
      const includeSchedules = req.query.includeSchedules === 'true';
      
      if (includeSchedules) {
        const classWithSchedules = await storage.getClassWithSchedules(classId);
        
        if (!classWithSchedules) {
          return res.status(404).json({ message: "Class not found" });
        }
        
        res.json(classWithSchedules);
      } else {
        const classItem = await storage.getClass(classId);
        
        if (!classItem) {
          return res.status(404).json({ message: "Class not found" });
        }
        
        res.json(classItem);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  // Image upload endpoint
  app.post("/api/upload-image", requireAuth, (req, res) => {
    console.log("📸 Image upload request received");
    
    // Use multer middleware with error handling
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error("❌ Multer error:", err);
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: "File too large. Maximum size is 40MB." });
          }
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        // An unknown error occurred
        return res.status(500).json({ message: `Upload failed: ${err.message}` });
      }
      
      try {
        if (!req.file) {
          console.error("No file received in upload request");
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        console.log("File upload successful:", {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path
        });
        
        let imageUrl: string;
        
        if (cloudinaryEnabled) {
          // Using Cloudinary - the URL is in the path property
          imageUrl = (req.file as any).path; // Cloudinary returns the full URL in the path field
          console.log("✅ Cloudinary upload successful. URL:", imageUrl);
        } else {
          // Using local storage - verify file exists on disk
          const filePath = path.join(uploadsDir, req.file.filename);
          if (!fs.existsSync(filePath)) {
            console.error("File was not saved to disk:", filePath);
            return res.status(500).json({ message: "File upload failed - file not saved" });
          }
          
          // Return the file path that can be used as the image URL
          imageUrl = `/uploads/${req.file.filename}`;
          console.log("📁 Local storage upload successful. URL:", imageUrl);
        }
        
        res.json({ imageUrl });
      } catch (error) {
        console.error("Error processing uploaded file:", error);
        res.status(500).json({ message: "File upload failed" });
      }
    });
  });

  // Create a new class (coaches and admins)
  app.post("/api/classes", requireAuth, async (req, res) => {
    try {
      // Check if user is coach or admin
      if (req.user.role !== "coach" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Coach or admin access required" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      // Initialize class data with user ID
      // For admins: allow specifying a different coachId (for duplicating on behalf of other coaches)
      // For coaches: always use their own ID
      const classData: any = { 
        ...req.body, 
        coachId: req.user.role === 'admin' && req.body.coachId ? req.body.coachId : req.user!.id 
      };
      
      const isRecurring = classData.isRecurring === true;
      
      // Define required fields based on class type
      const baseRequiredFields = ['title', 'description', 'categoryId', 'price', 'capacity', 'location', 'address'];
      const singleOccurrenceFields = [...baseRequiredFields, 'startTime', 'endTime'];
      
      // For recurring classes with new recurrence format, we need startTime/endTime and recurrence data
      const recurringFields = isRecurring && classData.recurrenceType 
        ? [...baseRequiredFields, 'startTime', 'endTime', 'recurrenceType']
        : [...baseRequiredFields, 'schedules']; // Legacy schedule format
      
      // Choose required fields based on class type
      const requiredFields = isRecurring ? recurringFields : singleOccurrenceFields;
      
      // Check for missing fields
      const missingFields = requiredFields.filter(field => {
        if (field === 'schedules') {
          return !classData.schedules || !Array.isArray(classData.schedules) || classData.schedules.length === 0;
        }
        if (field === 'price') {
          return classData[field] === undefined || classData[field] === null || classData[field] === '';
        }
        return !classData[field];
      });
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Log the data we're trying to process
      console.log("Creating class with data from route:", {
        title: classData.title,
        categoryId: classData.categoryId,
        price: classData.price,
        capacity: classData.capacity,
        isRecurring: classData.isRecurring,
        schedulesCount: classData.schedules?.length,
        coachId: classData.coachId,
        originalCoachId: req.body.coachId,
        requestUserRole: req.user.role,
        requestUserId: req.user.id
      });
      
      // Create the class with properly formatted data
      const newClass = await storage.createClass(classData);
      
      // Handle recurring classes - check for both new recurrence format and legacy schedule format
      if (isRecurring) {
        // New recurrence format - the storage layer handles instance generation
        if (classData.recurrenceType) {
          console.log("Using new recurrence format - storage will handle instance generation");
          // The createClass method in storage will handle recurring instance creation
        }
        // Legacy schedule format 
        else if (classData.schedules && classData.schedules.length > 0 && 
                 classData.seriesStartDate && classData.seriesEndDate) {
        
        console.log("Creating individual class instances for recurring schedule");
        
        const seriesStartDate = new Date(classData.seriesStartDate);
        const seriesEndDate = new Date(classData.seriesEndDate);
        
        // Iterate through each day in the date range
        const currentDate = new Date(seriesStartDate);
        const createdClassIds = [newClass.id]; // Keep track of all created classes
        
        while (currentDate <= seriesEndDate) {
          const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
          
          // Check if there are any schedules for this day of the week
          const matchingSchedules = classData.schedules.filter(
            schedule => schedule.dayOfWeek === currentDayOfWeek
          );
          
          // For each matching schedule, create a class instance
          for (const schedule of matchingSchedules) {
            if (currentDate > seriesStartDate) { // Skip first day as we already created the primary class
              // Parse the time string (HH:MM)
              const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
              const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);
              
              // Create new Date objects for the specific date and time
              const startDateTime = new Date(currentDate);
              startDateTime.setHours(startHours, startMinutes, 0, 0);
              
              const endDateTime = new Date(currentDate);
              endDateTime.setHours(endHours, endMinutes, 0, 0);
              
              // Create a new class instance with the specific date and time
              const classInstance = {
                ...classData,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                isRecurring: false, // Set to false as this is a specific instance
                schedules: undefined, // Remove schedules array
                seriesStartDate: undefined, // Remove series dates
                seriesEndDate: undefined,
                parentClassId: newClass.id // Reference to the parent recurring class
              };
              
              // Create the class instance
              const newClassInstance = await storage.createClass(classInstance);
              createdClassIds.push(newClassInstance.id);
            }
          }
          
          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Created ${createdClassIds.length} class instances for recurring series`);
        }
      }
      
      // Return just the parent class
      const responseClass = newClass;
      
      res.status(201).json(responseClass);
    } catch (error: any) {
      console.error("Error creating class:", error);
      
      // Return more detailed error message
      res.status(500).json({ 
        message: "Failed to create class", 
        error: error.message || "Unknown error" 
      });
    }
  });



  // Delete class (coaches can delete their own, admins can delete any)
  app.delete("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const deleteOption = req.query.deleteOption as string; // 'this' or 'following'
      const reason = req.query.reason as string; // Optional cancellation reason
      
      // Check if the class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check authorization: coach can delete their own classes, admin can delete any
      const isCoachOwner = req.user.role === "coach" && classItem.coachId === req.user.id;
      const isAdmin = req.user.role === "admin";
      
      if (!isCoachOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this class" });
      }

      // Send cancellation notifications to customers before deletion
      try {
        if (classItem.recurringSeriesId && deleteOption === 'following') {
          // Get all classes that will be deleted to send notifications
          const classesToDelete = await storage.getClassesBySeriesId(classItem.recurringSeriesId);
          const filteredClasses = classesToDelete.filter(c => 
            c.startTime && new Date(c.startTime) >= new Date(classItem.startTime!)
          );
          
          for (const cls of filteredClasses) {
            await sendClassCancellationNotifications(cls.id, reason);
          }
        } else {
          await sendClassCancellationNotifications(classId, reason);
        }
      } catch (emailError) {
        console.error('Failed to send cancellation notifications:', emailError);
        // Continue with deletion even if emails fail
      }

      // Process credit refunds and subscription restorations for cancelled classes
      try {
        const classesToProcess = classItem.recurringSeriesId && deleteOption === 'following'
          ? await storage.getClassesBySeriesId(classItem.recurringSeriesId).then(classes =>
              classes.filter(c => c.startTime && new Date(c.startTime) >= new Date(classItem.startTime!))
            )
          : [classItem];

        for (const cls of classesToProcess) {
          const classBookings = await storage.getClassBookings(cls.id);
          const confirmedBookings = classBookings.filter(booking => booking.status === 'confirmed');
          
          for (const booking of confirmedBookings) {
            // Check if booking was paid with credits
            if (booking.paymentMethod === 'credit_free') {
              try {
                // Get the actual credits used for this booking from the ledger
                const creditsUsed = await storage.getCreditsUsedForBooking(booking.id);
                
                if (creditsUsed > 0) {
                  await storage.refundCreditsForBooking(
                    booking.userId,
                    creditsUsed, // Refund exact amount that was used
                    booking.id,
                    `Class cancelled by provider: ${cls.title}`
                  );
                  
                  console.log(`✅ Refunded ${creditsUsed / 100} credits to user ${booking.userId} for cancelled class booking ${booking.id}`);
                } else {
                  console.log(`⚠️ No credits to refund for booking ${booking.id} - no credit usage found in ledger`);
                }
              } catch (refundError) {
                console.error(`Failed to refund credits for booking ${booking.id}:`, refundError);
                // Continue processing other bookings
              }
            }
            
            // Check if booking was paid with subscription credit
            if (booking.paymentMethod === 'subscription') {
              try {
                const restored = await storage.restoreSubscriptionCreditForCancelledClass(booking.id);
                if (restored) {
                  console.log(`✅ Restored subscription credit for user ${booking.userId} for cancelled class booking ${booking.id}`);
                } else {
                  console.log(`⚠️ Could not restore subscription credit for booking ${booking.id} - no usage record found`);
                }
              } catch (subscriptionError) {
                console.error(`Failed to restore subscription credit for booking ${booking.id}:`, subscriptionError);
                // Continue processing other bookings
              }
            }
            // Package restoration is now handled automatically in storage.deleteClass
          }
        }
      } catch (refundError) {
        console.error('Failed to process credit/subscription refunds:', refundError);
        // Continue with deletion even if refunds fail
      }
      
      // Handle recurring class deletion
      if (classItem.recurringSeriesId && deleteOption === 'following') {
        await storage.deleteThisAndFollowingClasses(classId);
      } else {
        // Delete just this class
        await storage.deleteClass(classId);
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });
  
  // Update a class
  app.put("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Check if the class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check authorization: coach can update their own classes, admin can update any
      const isCoachOwner = req.user.role === "coach" && classItem.coachId === req.user.id;
      const isAdmin = req.user.role === "admin";
      
      if (!isCoachOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this class" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      // Check if this is a recurring class
      if (classItem.isRecurring) {
        // Redirect to the series update endpoint
        return res.status(400).json({ 
          message: "This is a recurring class series. Use the series update endpoint.",
          isRecurring: true,
          classId: classItem.id
        });
      }
      
      // CRITICAL: Block status='cancelled' updates - must use DELETE endpoint for proper cancellation
      if (req.body.status === 'cancelled') {
        return res.status(400).json({ 
          message: "Cannot set status to 'cancelled' directly. Use DELETE /api/classes/:id to properly cancel the class and restore package credits." 
        });
      }
      
      // Simplified update with just basic fields that we know work
      const updateData: any = {};
      
      // Only add fields that definitely exist and have valid values
      if (req.body.title) updateData.title = String(req.body.title);
      if (req.body.description) updateData.description = String(req.body.description);
      if (req.body.categoryId) updateData.categoryId = parseInt(req.body.categoryId);
      if (req.body.price !== undefined && req.body.price !== null && req.body.price !== '') updateData.price = parseFloat(req.body.price);
      if (req.body.capacity) updateData.capacity = parseInt(req.body.capacity);
      if (req.body.location) updateData.location = String(req.body.location);
      if (req.body.address) updateData.address = String(req.body.address);
      if (req.body.latitude !== undefined && req.body.latitude !== null) updateData.latitude = parseFloat(req.body.latitude);
      if (req.body.longitude !== undefined && req.body.longitude !== null) updateData.longitude = parseFloat(req.body.longitude);
      if (req.body.image) updateData.image = String(req.body.image);
      if (req.body.ageGroup) updateData.ageGroup = String(req.body.ageGroup);
      if (req.body.whatToBring !== undefined) updateData.whatToBring = req.body.whatToBring ? String(req.body.whatToBring) : null;
      if (req.body.toFindUs !== undefined) updateData.toFindUs = req.body.toFindUs ? String(req.body.toFindUs) : null;
      
      // Handle date fields carefully
      if (req.body.startTime) {
        updateData.startTime = new Date(req.body.startTime);
      }
      if (req.body.endTime) {
        updateData.endTime = new Date(req.body.endTime);
      }

      // Update the class using storage method
      // Track changes for notification
      const changes: string[] = [];
      if (updateData.title && updateData.title !== classItem.title) {
        changes.push(`Class name changed to "${updateData.title}"`);
      }
      if (updateData.startTime && updateData.startTime !== classItem.startTime) {
        const newDate = new Date(updateData.startTime);
        // Format date and time in Pacific Time for consistency with class location
        const PACIFIC_TIMEZONE = 'America/Los_Angeles';
        const newDatePT = toZonedTime(newDate, PACIFIC_TIMEZONE);
        const formattedDate = format(newDatePT, 'M/d/yyyy', { timeZone: PACIFIC_TIMEZONE });
        const formattedTime = format(newDatePT, 'h:mm:ss a', { timeZone: PACIFIC_TIMEZONE });
        changes.push(`Date/time changed to ${formattedDate} at ${formattedTime}`);
      }
      if (updateData.location && updateData.location !== classItem.location) {
        changes.push(`Location changed to "${updateData.location}"`);
      }
      if (updateData.price && updateData.price !== classItem.price) {
        changes.push(`Price changed to $${updateData.price}`);
      }
      if (updateData.capacity && updateData.capacity !== classItem.capacity) {
        changes.push(`Capacity changed to ${updateData.capacity} spots`);
      }

      const updatedClass = await storage.updateClass(classId, updateData);
      
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found or update failed" });
      }

      // Send update notifications if there are significant changes
      if (changes.length > 0) {
        try {
          await sendClassUpdateNotifications(classId, classItem, updatedClass, changes);
        } catch (emailError) {
          console.error('Failed to send class update notifications:', emailError);
          // Don't fail the update if emails fail
        }
      }
      
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  // Update a recurring class series (coaches and admins)
  app.put("/api/classes/:id/series", requireAuth, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Check if the class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check authorization: coach can update their own classes, admin can update any
      const isCoachOwner = req.user.role === "coach" && classItem.coachId === req.user.id;
      const isAdmin = req.user.role === "admin";
      
      if (!isCoachOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this class series" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      // Verify this is actually a recurring class (check for recurringSeriesId)
      if (!classItem.recurringSeriesId) {
        return res.status(400).json({ 
          message: "This is not a recurring class series. Use the regular update endpoint."
        });
      }
      
      // Parse the request body to ensure proper data types
      const updateData: any = {};
      
      // Only add fields that definitely exist and have valid values
      if (req.body.title) updateData.title = String(req.body.title);
      if (req.body.description) updateData.description = String(req.body.description);
      if (req.body.categoryId) updateData.categoryId = parseInt(req.body.categoryId);
      if (req.body.price !== undefined && req.body.price !== null && req.body.price !== '') updateData.price = parseFloat(req.body.price);
      if (req.body.capacity) updateData.capacity = parseInt(req.body.capacity);
      if (req.body.location) updateData.location = String(req.body.location);
      if (req.body.address) updateData.address = String(req.body.address);
      if (req.body.latitude !== undefined && req.body.latitude !== null) updateData.latitude = parseFloat(req.body.latitude);
      if (req.body.longitude !== undefined && req.body.longitude !== null) updateData.longitude = parseFloat(req.body.longitude);
      if (req.body.image) updateData.image = String(req.body.image);
      if (req.body.ageGroup) updateData.ageGroup = String(req.body.ageGroup);
      if (req.body.whatToBring !== undefined) updateData.whatToBring = req.body.whatToBring ? String(req.body.whatToBring) : null;
      if (req.body.toFindUs !== undefined) updateData.toFindUs = req.body.toFindUs ? String(req.body.toFindUs) : null;
      
      // Handle date fields carefully
      if (req.body.startTime) {
        updateData.startTime = new Date(req.body.startTime);
      }
      if (req.body.endTime) {
        updateData.endTime = new Date(req.body.endTime);
      }

      // Update the entire series
      const updatedClasses = await storage.updateClassSeries(classId, updateData);
      
      res.json({
        message: "Class series updated successfully",
        parentClass: updatedClasses[0],
        updatedCount: updatedClasses.length - 1 // Subtract 1 to exclude the parent class
      });
    } catch (error) {
      console.error("Error updating class series:", error);
      res.status(500).json({ message: "Failed to update class series" });
    }
  });

  // Like a class
  app.post("/api/classes/:id/like", requireAuth, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Check if already liked
      const isAlreadyLiked = await storage.isClassLikedByUser(userId, classId);
      if (isAlreadyLiked) {
        return res.status(400).json({ message: "Class already liked" });
      }

      const like = await storage.likeClass(userId, classId);
      res.status(201).json({ message: "Class liked successfully", like });
    } catch (error) {
      console.error("Error liking class:", error);
      res.status(500).json({ message: "Failed to like class" });
    }
  });

  // Unlike a class
  app.delete("/api/classes/:id/like", requireAuth, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Check if actually liked
      const isLiked = await storage.isClassLikedByUser(userId, classId);
      if (!isLiked) {
        return res.status(400).json({ message: "Class not liked" });
      }

      const success = await storage.unlikeClass(userId, classId);
      if (success) {
        res.json({ message: "Class unliked successfully" });
      } else {
        res.status(500).json({ message: "Failed to unlike class" });
      }
    } catch (error) {
      console.error("Error unliking class:", error);
      res.status(500).json({ message: "Failed to unlike class" });
    }
  });
  
  // Get user's liked classes
  app.get("/api/user/liked-classes", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const likedClassIds = await storage.getUserLikedClasses(userId);
      res.json(likedClassIds);
    } catch (error) {
      console.error("Error fetching user liked classes:", error);
      res.status(500).json({ message: "Failed to fetch liked classes" });
    }
  });

  // Get user's favorite providers (coaches whose classes they liked)
  app.get("/api/user/favorite-providers", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const favoriteProviders = await storage.getFavoriteProviders(userId);
      res.json(favoriteProviders);
    } catch (error) {
      console.error("Error fetching favorite providers:", error);
      res.status(500).json({ message: "Failed to fetch favorite providers" });
    }
  });

  // Get user's class attendance stats (all time, this month, last month)
  app.get("/api/user/class-stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserClassAttendanceStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching class attendance stats:", error);
      res.status(500).json({ message: "Failed to fetch class stats" });
    }
  });

  // Get classes by coach ID
  app.get("/api/coaches/:id/classes", async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const classes = await storage.getClassesByCoach(coachId);
      
      // Sort classes: recurring parent classes first, then by date
      const sortedClasses = classes.sort((a, b) => {
        // Put recurring parent classes at the top
        if (a.isRecurring && !b.isRecurring) return -1;
        if (!a.isRecurring && b.isRecurring) return 1;
        
        // For class instances that have a specific date
        if (a.startTime && b.startTime) {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        
        // If no startTime, sort by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      res.json(sortedClasses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coach classes" });
    }
  });

  // Get classes by coach ID with accurate future instance counts (for package validation)
  app.get("/api/coaches/:id/classes/with-future-counts", async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const classes = await storage.getClassesByCoach(coachId);
      const now = new Date();
      
      // Group classes by recurring series or individual class title
      const classGroups = new Map();
      
      classes.forEach(cls => {
        // Only include future classes
        if (cls.startTime && new Date(cls.startTime) <= now) {
          return; // Skip past classes
        }
        
        // Group by recurring series ID or class title
        const groupKey = cls.recurringSeriesId || `single_${cls.id}`;
        
        if (!classGroups.has(groupKey)) {
          classGroups.set(groupKey, {
            id: cls.id,
            title: cls.title,
            isRecurring: cls.isRecurring || !!cls.recurringSeriesId,
            recurringSeriesId: cls.recurringSeriesId, // Include series ID
            futureOccurrences: 0,
            groupKey
          });
        }
        
        // Count this as a future occurrence
        classGroups.get(groupKey).futureOccurrences++;
      });
      
      // Convert to array and add legacy field for compatibility
      const classesWithCounts = Array.from(classGroups.values()).map(group => ({
        ...group,
        estimatedFutureOccurrences: group.futureOccurrences, // For backward compatibility
        // Add identifier for package eligibility (series ID for recurring, class ID for one-time)
        packageIdentifier: group.recurringSeriesId || group.id.toString()
      }));
      
      res.json(classesWithCounts);
    } catch (error) {
      console.error("Error fetching coach classes with future counts:", error);
      res.status(500).json({ message: "Failed to fetch coach classes with future counts" });
    }
  });

  // Get approved coaches
  app.get("/api/coaches", async (req, res) => {
    try {
      const coaches = await storage.getApprovedCoaches();
      
      // Remove sensitive information
      const sanitizedCoaches = coaches.map(coach => {
        const { password, ...coachWithoutPassword } = coach;
        return coachWithoutPassword;
      });
      
      res.json(sanitizedCoaches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });

  // Get coach by ID
  app.get("/api/coaches/:id", async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const coach = await storage.getUser(coachId);
      
      if (!coach || coach.role !== "coach" || !coach.isApproved) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      // Remove sensitive information
      const { password, ...coachWithoutPassword } = coach;
      
      res.json(coachWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coach" });
    }
  });

  // Class Package Routes
  
  // Create a new package (coaches only)
  // Get all packages (public endpoint)
  app.get("/api/packages/all", async (req, res) => {
    try {
      const packages = await storage.getAllPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching all packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Get current coach's packages
  app.get("/api/packages/my", requireAuth, async (req, res) => {
    try {
      const coachId = req.user?.id;
      if (!coachId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const packages = await storage.getCoachPackages(coachId);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching coach packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post("/api/packages", requireAuth, async (req, res) => {
    try {
      // Check if user is coach
      if (req.user.role !== "coach") {
        return res.status(403).json({ message: "Coach access required" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      const packageData = {
        ...req.body,
        coachId: req.user.id,
        isActive: true
      };
      
      const newPackage = await storage.createPackage(packageData);
      res.status(201).json(newPackage);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  // Get packages for a specific coach (customer-facing, only show active packages)
  app.get("/api/coaches/:id/packages", async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const packages = await storage.getCoachPackages(coachId, true);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching coach packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Get a specific package
  app.get("/api/packages/:id", async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const pkg = await storage.getPackage(packageId);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      res.json(pkg);
    } catch (error) {
      console.error("Error fetching package:", error);
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });

  // Update a package (coaches can only update their own)
  app.put("/api/packages/:id", requireAuth, async (req, res) => {
    try {
      // Check if user is coach
      if (req.user.role !== "coach") {
        return res.status(403).json({ message: "Coach access required" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      const packageId = parseInt(req.params.id);
      const existingPackage = await storage.getPackage(packageId);
      
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (existingPackage.coachId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own packages" });
      }
      
      const updatedPackage = await storage.updatePackage(packageId, req.body);
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "Failed to update package" });
    }
  });

  // Delete a package (coaches can only delete their own)
  app.delete("/api/packages/:id", requireAuth, async (req, res) => {
    try {
      // Check if user is coach
      if (req.user.role !== "coach") {
        return res.status(403).json({ message: "Coach access required" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      const packageId = parseInt(req.params.id);
      const existingPackage = await storage.getPackage(packageId);
      
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (existingPackage.coachId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own packages" });
      }
      
      const deleted = await storage.deletePackage(packageId);
      if (deleted) {
        res.json({ message: "Package deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete package" });
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Update package status (active/inactive)
  app.patch("/api/packages/:id/status", requireAuth, async (req, res) => {
    try {
      // Check if user is coach
      if (req.user.role !== "coach") {
        return res.status(403).json({ message: "Coach access required" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      const packageId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }
      
      const existingPackage = await storage.getPackage(packageId);
      
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (existingPackage.coachId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own packages" });
      }
      
      const updatedPackage = await storage.updatePackage(packageId, { 
        isActive,
        status: isActive ? 'Active' : 'Inactive'
      });
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating package status:", error);
      res.status(500).json({ message: "Failed to update package status" });
    }
  });

  // Check if package has bookings (for delete protection)
  app.get("/api/packages/:id/bookings/check", requireAuth, async (req, res) => {
    try {
      // Check if user is coach
      if (req.user.role !== "coach") {
        return res.status(403).json({ message: "Coach access required" });
      }
      
      // Check if coach is approved (only for coach role)
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      const packageId = parseInt(req.params.id);
      
      const existingPackage = await storage.getPackage(packageId);
      
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (existingPackage.coachId !== req.user.id) {
        return res.status(403).json({ message: "You can only check your own packages" });
      }
      
      // Check if there are any package purchases or bookings for this package
      const hasBookings = await storage.checkPackageHasBookings(packageId);
      res.json({ hasBookings });
    } catch (error) {
      console.error("Error checking package bookings:", error);
      res.status(500).json({ message: "Failed to check package bookings" });
    }
  });

  // ========== TIME BOUND PACKAGE ROUTES ==========
  
  // Create a new time_bound package with sessions (coaches only)
  app.post("/api/time-bound-packages", requireAuth, async (req, res) => {
    try {
      // Check if user is coach
      if (req.user.role !== "coach") {
        return res.status(403).json({ message: "Coach access required" });
      }
      
      // Check if coach is approved
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      const { sessions, ...packageData } = req.body;
      
      // Validate required fields for time_bound package
      if (!packageData.title || !packageData.totalSessions || !packageData.price) {
        return res.status(400).json({ message: "Missing required fields: title, totalSessions, price" });
      }
      
      if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
        return res.status(400).json({ message: "Sessions array is required and must not be empty" });
      }
      
      if (sessions.length !== packageData.totalSessions) {
        return res.status(400).json({ 
          message: `Number of sessions (${sessions.length}) must match totalSessions (${packageData.totalSessions})` 
        });
      }
      
      // Create package with time_bound type
      // Convert ISO string dates to Date objects for Drizzle
      const newPackage = await storage.createPackage({
        ...packageData,
        coachId: req.user.id,
        packageType: 'time_bound',
        isActive: true,
        status: 'enabled',
        startDate: packageData.startDate ? new Date(packageData.startDate) : undefined,
        endDate: packageData.endDate ? new Date(packageData.endDate) : undefined,
      });
      
      // Get the timezone for the package location
      const packageTimezone = getTimezoneForState(packageData.state);
      
      // Create all sessions for this package with timezone-aware conversion
      const sessionRecords = sessions.map((session: any, index: number) => {
        // Parse the ISO date string sent from frontend
        const sentStartTime = new Date(session.startTime);
        const sentEndTime = new Date(session.endTime);
        
        // Extract the date and time components (these are what the user selected)
        // The frontend sends these as ISO strings, but we need to re-interpret them in the package's timezone
        const year = sentStartTime.getUTCFullYear();
        const month = sentStartTime.getUTCMonth();
        const day = sentStartTime.getUTCDate();
        const hours = sentStartTime.getUTCHours();
        const minutes = sentStartTime.getUTCMinutes();
        
        // Create a date object representing this local time in the package's timezone
        // then convert it to UTC for storage
        const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        const startTimeUTC = fromZonedTime(localDateStr, packageTimezone);
        
        // Calculate end time in the same way
        const endHours = sentEndTime.getUTCHours();
        const endMinutes = sentEndTime.getUTCMinutes();
        const endLocalDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
        const endTimeUTC = fromZonedTime(endLocalDateStr, packageTimezone);
        
        // Date column should just be the date (no time)
        const sessionDate = new Date(year, month, day);
        
        return {
          packageId: newPackage.id,
          sessionNumber: index + 1,
          date: sessionDate,
          startTime: startTimeUTC,
          endTime: endTimeUTC,
          location: session.location || packageData.location,
          addressLine1: session.addressLine1 || packageData.addressLine1,
          city: session.city || packageData.city,
          state: session.state || packageData.state,
          zipCode: session.zipCode || packageData.zipCode,
          address: session.address || packageData.address,
          latitude: session.latitude || packageData.latitude,
          longitude: session.longitude || packageData.longitude,
          sessionType: session.sessionType || null,
          status: 'scheduled'
        };
      });
      
      const createdSessions = await storage.createTimeBoundPackageSessions(sessionRecords);
      
      res.status(201).json({
        package: newPackage,
        sessions: createdSessions
      });
    } catch (error) {
      console.error("Error creating time_bound package:", error);
      res.status(500).json({ message: "Failed to create time_bound package" });
    }
  });

  // Get a time_bound package with all its sessions
  app.get("/api/time-bound-packages/:id", async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const packageWithSessions = await storage.getTimeBoundPackageWithSessions(packageId);
      
      if (!packageWithSessions) {
        return res.status(404).json({ message: "Time bound package not found" });
      }
      
      // Flatten response: spread package fields and add sessions array
      const { package: pkg, sessions } = packageWithSessions;
      
      res.json({
        ...pkg,
        sessions
      });
    } catch (error) {
      console.error("Error fetching time_bound package:", error);
      res.status(500).json({ message: "Failed to fetch time_bound package" });
    }
  });

  // Get sessions for a time_bound package
  app.get("/api/time-bound-packages/:id/sessions", async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const sessions = await storage.getTimeBoundPackageSessions(packageId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching time_bound package sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Update a time_bound package and its sessions
  app.put("/api/time-bound-packages/:id", requireAuth, async (req, res) => {
    try {
      // Check if user is coach
      if (req.user.role !== "coach") {
        return res.status(403).json({ message: "Coach access required" });
      }
      
      if (req.user.role === "coach" && !req.user.isApproved) {
        return res.status(403).json({ message: "Your coach account is pending approval" });
      }
      
      const packageId = parseInt(req.params.id);
      const existingPackage = await storage.getPackage(packageId);
      
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (existingPackage.coachId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own packages" });
      }
      
      const { sessions, ...packageData } = req.body;
      
      // Filter out fields that shouldn't be updated
      const {
        id, coachId, packageType, createdAt, updatedAt,
        ...updateData
      } = packageData;
      
      // Convert date strings to Date objects if present
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }
      
      // Update package fields
      const updatedPackage = await storage.updatePackage(packageId, updateData);
      
      // Update sessions if provided
      if (sessions && Array.isArray(sessions)) {
        // Delete existing sessions
        await storage.deleteTimeBoundPackageSessions(packageId);
        
        // Get the timezone for the package location
        const packageTimezone = getTimezoneForState(updateData.state || existingPackage.state);
        
        // Create new sessions with timezone-aware conversion
        const sessionRecords = sessions.map((session: any) => {
          // Parse the date string (ISO format from frontend)
          const sessionDate = new Date(session.date);
          const year = sessionDate.getUTCFullYear();
          const month = sessionDate.getUTCMonth() + 1;
          const day = sessionDate.getUTCDate();
          
          // Parse the time string (HH:MM format from frontend)
          const [hours, minutes] = session.startTime.split(':');
          
          // Create a local datetime string in the package's timezone
          const localDateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
          
          // Convert from the package's timezone to UTC
          const startTimeUTC = fromZonedTime(localDateTimeStr, packageTimezone);
          
          // Calculate end time by adding duration (in minutes)
          const endTimeUTC = new Date(startTimeUTC.getTime() + session.duration * 60000);
          
          // Date column should just be the date (no time)
          const dateOnly = new Date(year, month - 1, day);
          
          return {
            packageId,
            sessionNumber: session.sessionNumber,
            date: dateOnly,
            startTime: startTimeUTC,
            endTime: endTimeUTC,
            location: session.location || updateData.location,
            addressLine1: session.addressLine1 || updateData.addressLine1,
            city: session.city || updateData.city,
            state: session.state || updateData.state,
            zipCode: session.zipCode || updateData.zipCode,
            address: session.address || updateData.address,
            latitude: session.latitude || updateData.latitude,
            longitude: session.longitude || updateData.longitude,
            sessionType: session.sessionType || null,
            status: 'scheduled'
          };
        });
        
        await storage.createTimeBoundPackageSessions(sessionRecords);
      }
      
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating time_bound package:", error);
      res.status(500).json({ message: "Failed to update time_bound package" });
    }
  });

  // Book a time_bound package (creates booking and scheduled payout)
  app.post("/api/time-bound-packages/:id/book", requireAuth, async (req, res) => {
    try {
      const packageId = parseInt(req.params.id);
      const { paymentIntentId, quantity = 1, stripeFee, promoCode, appliedCredits = 0 } = req.body;
      
      // Get package with sessions
      const packageWithSessions = await storage.getTimeBoundPackageWithSessions(packageId);
      if (!packageWithSessions) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const { package: pkg, sessions } = packageWithSessions;
      
      // Verify it's a time_bound package
      if (pkg.packageType !== 'time_bound') {
        return res.status(400).json({ message: "Package is not a time_bound package" });
      }
      
      // Check if user is trying to book their own package
      if (pkg.coachId === req.user.id) {
        return res.status(400).json({ message: "You cannot book your own package" });
      }
      
      // Check capacity for quantity
      const existingBookings = await storage.getTimeBoundPackageBookingsByPackage(packageId);
      const activeBookings = existingBookings.filter(b => b.status === 'active');
      if (activeBookings.length + quantity > (pkg.capacity || 999)) {
        return res.status(400).json({ message: "Not enough spots available" });
      }
      
      // Calculate prorated pricing if late join is allowed
      const now = new Date();
      const futureSessions = sessions.filter(s => new Date(s.startTime) > now);
      const sessionsRemaining = futureSessions.length;
      
      let pricePerSpot = pkg.price;
      if (pkg.allowLateJoin && sessionsRemaining < pkg.totalSessions) {
        pricePerSpot = (pkg.price / pkg.totalSessions) * sessionsRemaining;
      } else if (!pkg.allowLateJoin && sessionsRemaining < pkg.totalSessions) {
        return res.status(400).json({ message: "Cannot join after program has started" });
      }
      
      // Get promo code data if provided
      let promoCodeRecord = null;
      let totalDiscount = 0;
      let totalSubsidy = 0;
      
      if (promoCode) {
        const validation = await storage.validatePromoCodeForPackage(promoCode, req.user.id, packageId, quantity);
        if (validation.valid && validation.promoCode) {
          promoCodeRecord = validation.promoCode;
          const baseAmountCents = Math.round(pricePerSpot * quantity * 100);
          const discountCalc = await storage.calculateDiscount(promoCodeRecord, baseAmountCents);
          totalDiscount = discountCalc.discountAmount;
          totalSubsidy = discountCalc.subsidyAmount;
        }
      }
      
      // Deduct credits if used
      if (appliedCredits > 0) {
        await storage.deductUserCredits(
          req.user.id,
          appliedCredits,
          `Applied to time-bound package: ${pkg.name}`
        );
      }
      
      // Create booking(s) for each quantity
      const bookings = [];
      const stripeFeeDecimal = stripeFee || 0;
      const stripeFeePerSpot = stripeFeeDecimal / quantity;
      
      for (let i = 0; i < quantity; i++) {
        const netAmount = pricePerSpot - stripeFeePerSpot;
        const platformFee = netAmount * 0.15;
        const providerPayout = netAmount - platformFee;
        
        const booking = await storage.createTimeBoundPackageBooking({
          packageId: pkg.id,
          userId: req.user.id,
          totalPrice: pricePerSpot.toString(),
          originalPrice: pkg.price.toString(),
          sessionsAtBooking: sessionsRemaining,
          totalSessions: pkg.totalSessions,
          currency: 'usd',
          paymentIntentId,
          paymentStatus: 'completed',
          stripeFee: stripeFeePerSpot.toString(),
          netAmount: netAmount.toString(),
          platformFee: platformFee.toString(),
          providerPayout: providerPayout.toString(),
          sessionsCompleted: 0,
          status: 'active'
        });
        
        bookings.push(booking);
        
        // Record promo code usage (only once for first booking)
        if (promoCodeRecord && i === 0) {
          await storage.recordPromoCodeUsage({
            promoCodeId: promoCodeRecord.id,
            userId: req.user.id,
            bookingId: null,
            packageId: pkg.id,
            usedAt: new Date(),
            discountAmount: Math.round(totalDiscount / quantity),
            subsidyAmount: Math.round(totalSubsidy / quantity)
          });
        }
        
        // Create scheduled payout (2 days after booking)
        const scheduledPayoutDate = new Date();
        scheduledPayoutDate.setDate(scheduledPayoutDate.getDate() + 2);
        
        // Platform subsidy covers discount and credits used (per spot)
        const platformSubsidyPerSpot = Math.round((totalDiscount + appliedCredits) / quantity);
        const coachPayoutWithSubsidy = Math.round(providerPayout * 100) + platformSubsidyPerSpot;
        
        await storage.createScheduledPayout({
          classPackageId: pkg.id,
          coachId: pkg.coachId,
          customerId: req.user.id,
          stripePaymentIntentId: paymentIntentId,
          amountCents: Math.round(pricePerSpot * 100),
          stripeFee: Math.round(stripeFeePerSpot * 100),
          netAmount: Math.round(netAmount * 100),
          coachPayout: coachPayoutWithSubsidy,
          platformFee: Math.round(platformFee * 100) - platformSubsidyPerSpot,
          payoutType: 'package_purchase',
          scheduledPayoutDate,
          status: 'scheduled'
        });
      }
      
      // Send confirmation emails
      try {
        const coach = await storage.getUser(pkg.coachId);
        if (coach) {
          const { sendPackagePurchaseConfirmation, sendPackagePurchaseNotification } = await import('./email');
          
          const totalPaid = (pricePerSpot * quantity) - (totalDiscount / 100) - (appliedCredits / 100);
          
          const pricingDetails = {
            originalPrice: pricePerSpot * quantity,
            discountAmount: totalDiscount / 100,
            finalAmount: totalPaid,
            stripeFee: stripeFeeDecimal,
            appliedCredits: appliedCredits / 100
          };
          
          // Customer confirmation
          await sendPackagePurchaseConfirmation({
            packagePurchase: { id: bookings[0].id, quantity } as any,
            packageDetails: pkg,
            customer: req.user,
            coach,
            pricingDetails
          });
          
          // Coach notification
          const providerPayoutTotal = bookings.reduce((sum, b) => sum + parseFloat(b.providerPayout), 0);
          await sendPackagePurchaseNotification({
            packagePurchase: { id: bookings[0].id, quantity } as any,
            packageDetails: pkg,
            customer: req.user,
            coach,
            pricingDetails: {
              coachPayout: providerPayoutTotal,
              totalAmount: pricePerSpot * quantity
            }
          });
        }
      } catch (emailError) {
        console.error("Error sending package booking emails:", emailError);
      }
      
      res.status(201).json({
        success: true,
        booking: bookings[0],
        message: `Successfully booked ${quantity} spot(s) in ${pkg.name}`
      });
    } catch (error) {
      console.error("Error booking time_bound package:", error);
      res.status(500).json({ message: "Failed to book package" });
    }
  });

  // Free booking for time-bound packages (promo codes or credits covering full cost)
  app.post("/api/time-bound-packages/free-booking", requireAuth, async (req, res) => {
    try {
      const { packageId, quantity = 1, promoCode, appliedCredits = 0 } = req.body;
      
      if (!packageId) {
        return res.status(400).json({ message: "Package ID is required" });
      }
      
      // Get package with sessions
      const packageWithSessions = await storage.getTimeBoundPackageWithSessions(parseInt(packageId));
      if (!packageWithSessions) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const { package: pkg, sessions } = packageWithSessions;
      
      // Verify it's a time_bound package
      if (pkg.packageType !== 'time_bound') {
        return res.status(400).json({ message: "Package is not a time_bound package" });
      }
      
      // Check if user is trying to book their own package
      if (pkg.coachId === req.user.id) {
        return res.status(400).json({ message: "You cannot book your own package" });
      }
      
      // Check capacity for quantity
      const existingBookings = await storage.getTimeBoundPackageBookingsByPackage(parseInt(packageId));
      const activeBookings = existingBookings.filter(b => b.status === 'active');
      if (activeBookings.length + quantity > (pkg.capacity || 999)) {
        return res.status(400).json({ message: "Not enough spots available" });
      }
      
      // Calculate prorated pricing if late join is allowed
      const now = new Date();
      const futureSessions = sessions.filter(s => new Date(s.startTime) > now);
      const sessionsRemaining = futureSessions.length;
      
      let pricePerSpot = pkg.price;
      if (pkg.allowLateJoin && sessionsRemaining < pkg.totalSessions) {
        pricePerSpot = (pkg.price / pkg.totalSessions) * sessionsRemaining;
      } else if (!pkg.allowLateJoin && sessionsRemaining < pkg.totalSessions) {
        return res.status(400).json({ message: "Cannot join after program has started" });
      }
      
      const totalPrice = pricePerSpot * quantity;
      const totalPriceCents = Math.round(totalPrice * 100);
      
      let promoCodeRecord = null;
      let discountAmount = 0;
      let subsidyAmount = 0;
      
      // Validate and apply promo code if provided
      if (promoCode) {
        const validation = await storage.validatePromoCodeForPackage(promoCode, req.user.id, parseInt(packageId), quantity);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error || "Invalid promo code" });
        }
        promoCodeRecord = validation.promoCode!;
        
        const discountCalc = await storage.calculateDiscount(promoCodeRecord, totalPriceCents);
        discountAmount = discountCalc.discountAmount;
        subsidyAmount = discountCalc.subsidyAmount;
      }
      
      const finalAmount = Math.max(0, totalPriceCents - discountAmount - appliedCredits);
      
      if (finalAmount > 0) {
        return res.status(400).json({ message: "This endpoint is only for free bookings (100% covered by promo or credits)" });
      }
      
      // Deduct credits if used
      if (appliedCredits > 0) {
        const userCreditBalance = await storage.getUserCreditBalance(req.user.id);
        if (userCreditBalance < appliedCredits) {
          return res.status(400).json({ message: "Insufficient credits" });
        }
      }
      
      // Create booking(s) for each quantity
      const bookings = [];
      for (let i = 0; i < quantity; i++) {
        const netAmount = pricePerSpot;
        const platformFee = netAmount * 0.15;
        const providerPayout = netAmount - platformFee;
        
        const booking = await storage.createTimeBoundPackageBooking({
          packageId: pkg.id,
          userId: req.user.id,
          totalPrice: pricePerSpot.toString(),
          originalPrice: pkg.price.toString(),
          sessionsAtBooking: sessionsRemaining,
          totalSessions: pkg.totalSessions,
          currency: 'usd',
          paymentIntentId: null,
          paymentStatus: 'completed',
          stripeFee: '0',
          netAmount: netAmount.toString(),
          platformFee: platformFee.toString(),
          providerPayout: providerPayout.toString(),
          sessionsCompleted: 0,
          status: 'active'
        });
        
        bookings.push(booking);
        
        // Record promo code usage if applicable
        if (promoCodeRecord && i === 0) {
          await storage.recordPromoCodeUsage({
            promoCodeId: promoCodeRecord.id,
            userId: req.user.id,
            bookingId: null,
            packageId: pkg.id,
            usedAt: new Date(),
            discountAmount: Math.round(discountAmount / quantity),
            subsidyAmount: Math.round(subsidyAmount / quantity)
          });
        }
        
        // Deduct credits for each spot
        if (appliedCredits > 0 && i === 0) {
          await storage.deductUserCredits(
            req.user.id,
            appliedCredits,
            `Applied to time-bound package: ${pkg.name}`,
            booking.id
          );
        }
        
        // Schedule payout with platform subsidy for discounts/credits
        const scheduledPayoutDate = new Date();
        scheduledPayoutDate.setDate(scheduledPayoutDate.getDate() + 2);
        
        // Platform subsidy covers discount and credits used
        const platformSubsidy = Math.round((discountAmount + appliedCredits) / quantity);
        const coachPayoutWithSubsidy = Math.round(providerPayout * 100) + platformSubsidy;
        
        await storage.createScheduledPayout({
          classPackageId: pkg.id,
          coachId: pkg.coachId,
          customerId: req.user.id,
          stripePaymentIntentId: null,
          amountCents: Math.round(pricePerSpot * 100),
          stripeFee: 0,
          netAmount: Math.round(pricePerSpot * 100),
          coachPayout: coachPayoutWithSubsidy,
          platformFee: Math.round(platformFee * 100) - platformSubsidy,
          payoutType: 'package_purchase',
          scheduledPayoutDate,
          status: 'scheduled'
        });
      }
      
      // Send confirmation emails
      try {
        const coach = await storage.getUser(pkg.coachId);
        if (coach) {
          const { sendPackagePurchaseConfirmation, sendPackagePurchaseNotification } = await import('./email');
          
          const pricingDetails = {
            originalPrice: totalPrice,
            discountAmount: discountAmount / 100,
            finalAmount: 0,
            stripeFee: 0,
            appliedCredits: appliedCredits / 100
          };
          
          // Customer confirmation
          await sendPackagePurchaseConfirmation({
            packagePurchase: { id: bookings[0].id, quantity } as any,
            packageDetails: pkg,
            customer: req.user,
            coach,
            pricingDetails
          });
          
          // Coach notification
          await sendPackagePurchaseNotification({
            packagePurchase: { id: bookings[0].id, quantity } as any,
            packageDetails: pkg,
            customer: req.user,
            coach,
            pricingDetails: {
              coachPayout: (providerPayout * quantity),
              totalAmount: totalPrice
            }
          });
        }
      } catch (emailError) {
        console.error("Error sending free package booking emails:", emailError);
      }
      
      res.json({
        success: true,
        message: `Successfully booked ${quantity} spot(s) in ${pkg.name}`,
        booking: bookings[0]
      });
    } catch (error: any) {
      console.error("Free time-bound package booking error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get customer's time_bound package bookings
  app.get("/api/time-bound-packages/my/bookings", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getUserTimeBoundPackageBookings(req.user.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user time_bound package bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Check class availability (used before payment)
  app.post("/api/classes/:id/check-availability", requireAuth, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Validate class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if the user is the coach of this class
      if (classItem.coachId === userId) {
        return res.status(400).json({ message: "You cannot book your own class" });
      }
      
      // Check if class has capacity
      const classBookings = await storage.getClassBookings(classId);
      const confirmedBookings = classBookings.filter(booking => 
        booking.status === "confirmed"
      );
      
      // Check if admin marked class as full
      if (classItem.markedFull) {
        return res.status(400).json({ message: "Class is fully booked" });
      }
      
      if (confirmedBookings.length >= classItem.capacity) {
        return res.status(400).json({ message: "Class is fully booked" });
      }
      
      // Return availability status
      res.json({ 
        available: true, 
        spotsLeft: classItem.markedFull ? 0 : classItem.capacity - confirmedBookings.length 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Get user bookings
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const bookings = await storage.getUserBookings(userId);
      
      // Add class details to each booking
      const bookingsWithClass = await Promise.all(
        bookings.map(async (booking) => {
          const classItem = await storage.getClass(booking.classId);
          return {
            ...booking,
            class: classItem
          };
        })
      );
      
      res.json(bookingsWithClass);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get user's purchased packages
  app.get("/api/user/packages", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const packages = await storage.getUserPackagePurchases(userId);
      
      // Add package details and coach info to each purchase
      const packagesWithDetails = await Promise.all(
        packages.map(async (purchase) => {
          const packageDetails = await storage.getPackage(purchase.packageId);
          let coachDetails = null;
          
          if (packageDetails) {
            coachDetails = await storage.getUser(packageDetails.coachId);
          }
          
          return { 
            ...purchase, 
            packageDetails,
            coachDetails 
          };
        })
      );
      
      res.json(packagesWithDetails);
    } catch (error) {
      console.error("Error fetching user packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });
  
  // Get booking count for a class
  app.get("/api/classes/:id/bookings/count", async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Validate class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      const classBookings = await storage.getClassBookings(classId);
      const confirmedBookings = classBookings.filter(booking => 
        booking.status === "confirmed"
      );
      
      // Calculate total spots booked by summing quantities
      const totalSpotsBooked = confirmedBookings.reduce((sum, booking) => {
        return sum + (booking.quantity || 1);
      }, 0);
      
      res.json({
        total: classBookings.length,
        active: confirmedBookings.length,
        totalSpotsBooked: totalSpotsBooked,
        capacity: classItem.capacity,
        spotsLeft: classItem.markedFull ? 0 : classItem.capacity - totalSpotsBooked,
        markedFull: classItem.markedFull || false
      });
    } catch (error) {
      console.error("Error getting booking count:", error);
      res.status(500).json({ message: "Failed to fetch booking count" });
    }
  });

  // Cancel booking
  app.put("/api/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking belongs to user
      if (booking.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }
      
      // Get class details for timing and refund calculations
      const classItem = await storage.getClass(booking.classId);
      if (!classItem) {
        return res.status(404).json({ message: "Associated class not found" });
      }

      // Process credit refund if applicable (paid with credits + >24 hours before class)
      if (booking.paymentMethod === 'credit_free' && classItem.startTime) {
        const classStartTime = new Date(classItem.startTime);
        const currentTime = new Date();
        const hoursUntilClass = (classStartTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilClass > 24) {
          try {
            // Get the actual credits used for this booking from the ledger
            const creditsUsed = await storage.getCreditsUsedForBooking(booking.id);
            
            if (creditsUsed > 0) {
              await storage.refundCreditsForBooking(
                booking.userId,
                creditsUsed, // Refund exact amount that was used
                booking.id,
                `Customer cancellation >24h before class: ${classItem.title}`
              );
              
              console.log(`✅ Refunded ${creditsUsed / 100} credits to user ${booking.userId} for booking ${booking.id} cancelled >24h in advance`);
            } else {
              console.log(`⚠️ No credits to refund for booking ${booking.id} - no credit usage found in ledger`);
            }
          } catch (refundError) {
            console.error('Failed to process credit refund:', refundError);
            // Continue with cancellation even if refund fails
          }
        } else {
          console.log(`❌ No credit refund for booking ${booking.id} - cancellation within 24 hours (${hoursUntilClass.toFixed(2)}h before class)`);
        }
      }

      // Process package restoration if booking was made with a package
      if (booking.paymentMethod === 'package') {
        try {
          // Find the package booking record
          const packageBooking = await storage.getPackageBookingByBookingId(booking.id);
          
          if (packageBooking) {
            // Update package booking status to cancelled
            await storage.updatePackageBooking(packageBooking.id, { status: 'cancelled' });
            
            // Get the package purchase to restore class counts
            const packagePurchase = await storage.getPackagePurchase(packageBooking.packagePurchaseId);
            
            if (packagePurchase) {
              // Restore the package counts: increment remainingClasses and decrement usedClasses
              await storage.updatePackagePurchase(packagePurchase.id, {
                usedClasses: packagePurchase.usedClasses - booking.quantity,
                remainingClasses: packagePurchase.remainingClasses + booking.quantity
              });
              
              console.log(`✅ Restored ${booking.quantity} class(es) to package ${packagePurchase.id} for cancelled booking ${booking.id}`);
            } else {
              console.error(`⚠️ Package purchase not found for package booking ${packageBooking.id}`);
            }
          } else {
            console.error(`⚠️ Package booking not found for booking ${booking.id} with payment method 'package'`);
          }
        } catch (packageError) {
          console.error('Failed to restore package classes:', packageError);
          // Continue with cancellation even if package restoration fails
        }
      }

      // Process subscription credit restoration if booking was made with subscription (>24 hours before class)
      if (booking.paymentMethod === 'subscription' && classItem.startTime) {
        const classStartTime = new Date(classItem.startTime);
        const currentTime = new Date();
        const hoursUntilClass = (classStartTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilClass > 24) {
          try {
            const restored = await storage.restoreSubscriptionCreditForCancelledClass(booking.id);
            if (restored) {
              console.log(`✅ Restored subscription credit for user ${booking.userId} for booking ${booking.id} cancelled >24h in advance`);
            } else {
              console.log(`⚠️ Could not restore subscription credit for booking ${booking.id} - no usage record found`);
            }
          } catch (subscriptionError) {
            console.error('Failed to restore subscription credit:', subscriptionError);
            // Continue with cancellation even if subscription restoration fails
          }
        } else {
          console.log(`❌ No subscription credit restoration for booking ${booking.id} - cancellation within 24 hours (${hoursUntilClass.toFixed(2)}h before class)`);
        }
      }
      
      const updatedBooking = await storage.updateBooking(bookingId, { status: "cancelled" });

      // Send booking cancellation confirmation email
      try {
        const coach = await storage.getUser(classItem.coachId);
        if (coach) {
          const refundAmount = (classItem.price * booking.quantity);
          await sendBookingCancellationConfirmation(
            req.user,
            classItem,
            coach,
            refundAmount
          );
        }
      } catch (emailError) {
        console.error('Failed to send booking cancellation email:', emailError);
        // Don't fail the cancellation if email fails
      }

      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/all-customers", requireAdmin, async (req, res) => {
    try {
      const customerBookings = await storage.getAllCustomerBookings();
      res.json(customerBookings);
    } catch (error) {
      console.error("Error fetching all customers:", error);
      res.status(500).json({ message: "Failed to fetch customer bookings" });
    }
  });

  // Admin endpoint to get all classes (past and future) for Master Calendar
  app.get("/api/admin/all-classes", requireAdmin, async (req, res) => {
    try {
      const coachId = req.query.coachId ? parseInt(req.query.coachId as string) : undefined;
      const classes = await storage.getAllClassesForAdmin(coachId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching all classes for admin:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.put("/api/admin/coaches/:id/approve", requireAdmin, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const coach = await storage.approveCoach(coachId);
      
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }

      // Send coach approval notification email
      try {
        await sendCoachApprovalNotification(coach);
      } catch (emailError) {
        console.error('Failed to send coach approval email:', emailError);
        // Don't fail approval if email fails
      }
      
      // Remove password
      const { password, ...coachWithoutPassword } = coach;
      
      res.json(coachWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve coach" });
    }
  });

  // Stripe payment intent creation
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    try {
      const { classId } = req.body;
      
      // Get the class to determine the price
      const classItem = await storage.getClass(parseInt(classId));
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Create a PaymentIntent with the class price
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(classItem.price * 100), // Convert to cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        // Store the class and user IDs as metadata
        metadata: {
          classId: classItem.id.toString(),
          userId: req.user.id.toString(),
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: `Payment intent creation failed: ${error.message}` });
    }
  });

  // Webhook for Stripe events
  app.post("/api/webhook", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }
    
    const payload = req.body;
    
    try {
      // Handle successful payment
      if (payload.type === "payment_intent.succeeded") {
        const paymentIntent = payload.data.object;
        
        // Get the class and user IDs from metadata
        const { classId, userId } = paymentIntent.metadata;
        
        // Find all pending bookings for this user and class
        const userBookings = await storage.getUserBookings(parseInt(userId));
        const pendingBooking = userBookings.find(
          b => b.classId === parseInt(classId) && b.status === "pending"
        );
        
        if (pendingBooking) {
          // Update booking status to confirmed
          await storage.updateBooking(pendingBooking.id, {
            status: "confirmed",
            stripePaymentId: paymentIntent.id
          });
        }
      }
      
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Google Maps proxy endpoints to avoid CORS issues and permission prompts
  app.get("/api/maps/places/autocomplete", async (req, res) => {
    try {
      const input = req.query.input as string;
      if (!input) {
        return res.status(400).json({ error: "Input is required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error("Error proxying places autocomplete:", error);
      res.status(500).json({ error: "Failed to get places suggestions" });
    }
  });
  
  app.get("/api/maps/places/details", async (req, res) => {
    try {
      const placeId = req.query.place_id as string;
      if (!placeId) {
        return res.status(400).json({ error: "Place ID is required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error("Error proxying place details:", error);
      res.status(500).json({ error: "Failed to get place details" });
    }
  });
  
  app.get("/api/maps/geocode", async (req, res) => {
    try {
      const latlng = req.query.latlng as string;
      if (!latlng) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error("Error proxying geocoding:", error);
      res.status(500).json({ error: "Failed to get geocoding results" });
    }
  });
  
  // Payment processing routes
  
  // Create a payment intent for booking a class
  app.post("/api/payment/create-intent", requireAuth, async (req, res) => {
    try {
      const { classId, amount, quantity = 1, promoCode, useCredits = false, appliedCredits = 0 } = req.body;
      
      if (!classId || !amount) {
        return res.status(400).json({ message: "Missing required parameters: classId, amount" });
      }

      // The frontend sends the 'amount' that already includes all discounts and credits applied
      // We just need to use this amount directly without further modifications
      let finalAmount = parseFloat(amount);
      let promoCodeData = null;
      let originalClassPrice = 0; // Store the original class price for metadata
      let creditsApplied = 0; // Track credits applied in cents

      // Get class details to get the original price before any discounts
      const classDetailsForPrice = await storage.getClass(parseInt(classId));
      if (classDetailsForPrice) {
        originalClassPrice = classDetailsForPrice.price * quantity; // Original total price
      }

      // Get promo code data if provided (for metadata only, don't apply discount again)
      if (promoCode) {
        const validation = await storage.validatePromoCode(promoCode, req.user!.id, classId);
        if (validation.valid && validation.promoCode) {
          promoCodeData = validation.promoCode;
        }
      }
      
      // Store credits applied for metadata (frontend already deducted from amount)
      if (useCredits && appliedCredits > 0) {
        creditsApplied = appliedCredits; // Store in cents for metadata
      }
      
      // Check if user already has confirmed bookings for this class
      const userBookings = await storage.getUserBookings(req.user.id);
      const existingBookings = userBookings.filter(b => 
        b.classId === classId && b.status === "confirmed"
      );
      
      // Check if user already has a confirmed booking for this class
      if (existingBookings.length > 0) {
        return res.status(400).json({ message: "You already have a booking for this class" });
      }
      
      // Get class details for the payment description
      const classDetails = await storage.getClass(classId);
      if (!classDetails) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Get coach details for payment recipient
      const coach = await storage.getUser(classDetails.coachId);
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      // Create payment intent through Stripe
      if (stripe) {
        try {
          // Convert final amount (with discount applied) to cents
          const amountInCents = Math.round(finalAmount * 100);
          
          // Calculate Stripe fees: 2.9% + $0.30 per transaction
          const stripeFeePercentage = 0.029;
          const stripeFixedFee = 30; // 30 cents in cents
          const stripeFee = Math.round(amountInCents * stripeFeePercentage) + stripeFixedFee;
          
          // Calculate net amount after Stripe fees
          const netAmount = amountInCents - stripeFee;
          
          // Split net amount: 85% to coach, 15% to platform
          const coachPayout = Math.round(netAmount * 0.85);
          const platformFee = netAmount - coachPayout;
          
          // Create payment intent with Stripe Connect
          const paymentIntentData: any = {
            amount: amountInCents,
            currency: "usd",
            description: `Booking for ${classDetails.title}`,
            metadata: {
              classId: classId.toString(),
              userId: req.user.id.toString(),
              coachId: coach.id.toString(),
              stripeFee: stripeFee.toString(),
              netAmount: netAmount.toString(),
              platformFee: platformFee.toString(),
              coachPayout: coachPayout.toString(),
              promoCode: promoCodeData?.code || '',
              promoCodeId: promoCodeData?.id?.toString() || '',
              originalAmount: originalClassPrice.toString(),
              discountApplied: promoCodeData ? 'true' : 'false',
              creditsApplied: creditsApplied.toString(),
              creditsUsed: useCredits ? 'true' : 'false'
            }
          };

          // Don't transfer immediately - we'll handle delayed payouts after class completion
          // Store coach payout info in metadata for later processing
          paymentIntentData.metadata.delayedPayout = 'true';
          paymentIntentData.metadata.coachStripeId = coach.stripeConnectId || '';
          paymentIntentData.metadata.coachOnboarded = coach.stripeConnectOnboarded ? 'true' : 'false';

          // Add automatic payment methods to enable Link and Amazon Pay
          paymentIntentData.automatic_payment_methods = {
            enabled: true,
          };

          const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
          
          res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amountInCents,
            stripeFee,
            netAmount,
            platformFee,
            coachPayout
          });
        } catch (stripeError: any) {
          console.error("Stripe payment error:", stripeError);
          res.status(400).json({ 
            message: "Error creating payment intent", 
            error: stripeError.message 
          });
        }
      } else {
        // For testing when Stripe is not available
        const testAmountInCents = Math.round(parseFloat(amount) * 100);
        const testStripeFee = Math.round(testAmountInCents * 0.029) + 30;
        const testNetAmount = testAmountInCents - testStripeFee;
        const testCoachPayout = Math.round(testNetAmount * 0.85);
        const testPlatformFee = testNetAmount - testCoachPayout;
        
        res.status(200).json({
          clientSecret: "dummy_client_secret_for_testing",
          paymentIntentId: `dummy_pi_${Date.now()}`,
          amount: testAmountInCents,
          stripeFee: testStripeFee,
          netAmount: testNetAmount,
          platformFee: testPlatformFee,
          coachPayout: testCoachPayout
        });
      }
    } catch (error: any) {
      console.error("Payment creation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create free booking for $0 classes
  app.post("/api/bookings/free", requireAuth, async (req, res) => {
    try {
      const { classId, quantity = 1 } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }
      
      // Validate class exists and is free
      const classDetails = await storage.getClass(parseInt(classId));
      if (!classDetails) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (classDetails.price > 0) {
        return res.status(400).json({ message: "This endpoint is only for free classes" });
      }
      
      // Check capacity
      const existingBookings = await storage.getClassBookings(parseInt(classId));
      const confirmedBookings = existingBookings.filter(b => b.status === 'confirmed');
      const totalBookedSpots = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
      
      if (totalBookedSpots + quantity > classDetails.capacity) {
        return res.status(400).json({ 
          message: "Not enough spots available",
          availableSpots: classDetails.capacity - totalBookedSpots
        });
      }
      
      // Check if user already has a confirmed booking for this class
      const userBooking = existingBookings.find(b => b.userId === req.user.id && b.status === 'confirmed');
      if (userBooking) {
        return res.status(400).json({ message: "You have already booked this class" });
      }
      
      // Create confirmed booking directly for free class
      const booking = await storage.createBooking({
        userId: req.user.id,
        classId: parseInt(classId),
        quantity: quantity,
        status: 'confirmed'
      });
      
      // Send confirmation email
      try {
        const coach = await storage.getUser(classDetails.coachId);
        if (coach) {
          await sendBookingConfirmation({
            booking,
            classData: classDetails,
            customer: req.user,
            coach
          });
          
          // Send notification to coach
          await sendNewBookingNotificationToCoach(
            coach,
            req.user,
            classDetails,
            booking
          );

          // Send admin notification
          try {
            await sendBookingAdminNotification({
              booking,
              classData: classDetails,
              customer: req.user,
              coach,
              bookingType: 'promo_code',
              paymentAmount: 0
            });
          } catch (adminEmailError) {
            console.error("Admin notification error:", adminEmailError);
          }
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }

      // Update provider referral booking count for the coach
      try {
        await storage.updateProviderReferralBookingCount(classDetails.coachId);
        console.log(`Updated provider referral booking count for coach ${classDetails.coachId}`);
      } catch (providerReferralError) {
        console.error("Error updating provider referral booking count:", providerReferralError);
        // Don't fail the booking if provider referral update fails
      }
      
      res.json({ 
        success: true, 
        booking,
        message: `Free class booking confirmed for ${quantity} spot(s)` 
      });
    } catch (error: any) {
      console.error("Free booking error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create free booking with promo code (100% discount) OR credits covering full cost
  app.post("/api/bookings/free-promo", requireAuth, async (req, res) => {
    try {
      const { classId, quantity = 1, promoCode } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }
      
      // Validate class exists
      const classDetails = await storage.getClass(parseInt(classId));
      if (!classDetails) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      const originalAmount = classDetails.price * quantity * 100; // Amount in cents
      let discountAmount = 0;
      let promoCodeRecord = null;
      let isCreditsOnly = false;
      
      if (promoCode) {
        // Validate promo code provides 100% discount
        promoCodeRecord = await storage.getPromoCodeByCode(promoCode);
        if (!promoCodeRecord) {
          return res.status(400).json({ message: "Invalid promo code" });
        }
        
        // Calculate discount to verify it's 100%
        if (promoCodeRecord.discountType === 'percentage') {
          discountAmount = Math.round((originalAmount * promoCodeRecord.discountValue) / 100);
        } else {
          discountAmount = Math.round(promoCodeRecord.discountValue * 100); // Convert to cents
        }
        
        const finalAmount = Math.max(0, originalAmount - discountAmount);
        
        if (finalAmount > 0) {
          return res.status(400).json({ message: "This endpoint is only for 100% discount promo codes" });
        }
      } else {
        // Check if user has enough credits to cover the full cost
        const userCreditBalance = await storage.getUserCreditBalance(req.user.id);
        if (userCreditBalance < originalAmount) {
          return res.status(400).json({ 
            message: "Insufficient credits for free booking", 
            required: originalAmount,
            available: userCreditBalance 
          });
        }
        isCreditsOnly = true;
      }
      
      // Check capacity
      const existingBookings = await storage.getClassBookings(parseInt(classId));
      const confirmedBookings = existingBookings.filter(b => b.status === 'confirmed');
      const totalBookedSpots = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
      
      if (totalBookedSpots + quantity > classDetails.capacity) {
        return res.status(400).json({ 
          message: "Not enough spots available",
          availableSpots: classDetails.capacity - totalBookedSpots
        });
      }
      
      // Check if user already has a confirmed booking for this class
      const userBooking = existingBookings.find(b => b.userId === req.user.id && b.status === 'confirmed');
      if (userBooking) {
        return res.status(400).json({ message: "You have already booked this class" });
      }
      
      // Create confirmed booking directly for free booking
      const booking = await storage.createBooking({
        userId: req.user.id,
        classId: parseInt(classId),
        quantity: quantity,
        status: 'confirmed',
        paymentMethod: isCreditsOnly ? 'credit_free' : 'promo_free'
      });
      
      if (promoCodeRecord) {
        // Record promo code usage with the booking ID
        const subsidyAmount = originalAmount - discountAmount; // Platform covers the discount
        await storage.recordPromoCodeUsage({
          promoCodeId: promoCodeRecord.id,
          userId: req.user.id,
          classId: parseInt(classId),
          bookingId: booking.id,
          discountAmount: discountAmount,
          subsidyAmount: subsidyAmount,
          originalAmount: originalAmount
        });
      } else {
        // Apply credits for credit-only free booking
        await storage.applyCreditsToBooking(req.user.id, originalAmount, booking.id);
      }
      
      // Create scheduled payout for coach (always needed when booking is confirmed)
      const coach = await storage.getUser(classDetails.coachId);
      if (coach) {
        const amountCents = originalAmount; // Full class price in cents
        let coachPayout;
        let payoutType;
        
        // Check if promo code was used and if platform subsidizes the discount
        if (promoCodeRecord && !promoCodeRecord.platformSubsidized) {
          // Promo code with platform_subsidized = false and 100% discount = $0 for coach
          coachPayout = 0;
          payoutType = 'promo_non_subsidized';
        } else {
          // Platform subsidizes the discount or credit-only booking
          coachPayout = Math.round(amountCents * 0.85); // 85% of class price
          payoutType = 'fully_subsidized_booking';
        }
        
        // Calculate payout date: 2 days after class end time
        const classEndTime = new Date(classDetails.endTime || classDetails.startTime);
        const payoutDate = new Date(classEndTime);
        payoutDate.setDate(payoutDate.getDate() + 2);
        
        await storage.createScheduledPayout({
          bookingId: booking.id,
          classId: parseInt(classId),
          coachId: classDetails.coachId,
          customerId: req.user.id,
          stripePaymentIntentId: null, // No payment intent for credit_free bookings
          amountCents: amountCents,
          stripeFee: 0, // No stripe fee for credit_free
          netAmount: amountCents,
          coachPayout: coachPayout,
          platformFee: 0,
          payoutType: payoutType,
          scheduledPayoutDate: payoutDate
        });
      }
      
      // Send confirmation email
      try {
        const coach = await storage.getUser(classDetails.coachId);
        if (coach) {
          // For free bookings, show pricing details with discount/credit source
          const pricingDetails = {
            originalPrice: originalAmount / 100, // Convert from cents to dollars
            discountAmount: isCreditsOnly ? originalAmount / 100 : discountAmount / 100, // Convert from cents to dollars  
            finalAmount: 0, // Free after discount/credits
            discountSource: isCreditsOnly ? "Account Credits" : `Promo Code (${promoCode})`
          };
          
          await sendBookingConfirmation({
            booking,
            classData: classDetails,
            customer: req.user,
            coach,
            pricingDetails: pricingDetails
          });
          
          // Send notification to coach
          await sendNewBookingNotificationToCoach(
            coach,
            req.user,
            classDetails,
            booking
          );

          // Send admin notification
          try {
            await sendBookingAdminNotification({
              booking,
              classData: classDetails,
              customer: req.user,
              coach,
              bookingType: isCreditsOnly ? 'credits' : 'promo_code',
              paymentAmount: 0
            });
          } catch (adminEmailError) {
            console.error("Admin notification error:", adminEmailError);
          }
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }

      // Update provider referral booking count for the coach
      try {
        await storage.updateProviderReferralBookingCount(classDetails.coachId);
        console.log(`Updated provider referral booking count for coach ${classDetails.coachId}`);
      } catch (providerReferralError) {
        console.error("Error updating provider referral booking count:", providerReferralError);
        // Don't fail the booking if provider referral update fails
      }
      
      res.json({ 
        success: true, 
        booking,
        message: isCreditsOnly 
          ? `Free class booking confirmed with account credits for ${quantity} spot(s)` 
          : `Free class booking confirmed with promo code ${promoCode} for ${quantity} spot(s)` 
      });
    } catch (error: any) {
      console.error("Free promo booking error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create booking using a purchased package
  app.post("/api/bookings/package", requireAuth, async (req, res) => {
    try {
      const { classId, quantity = 1, packageId } = req.body;
      
      if (!classId || !packageId) {
        return res.status(400).json({ message: "Class ID and Package ID are required" });
      }
      
      // Validate class exists
      const classDetails = await storage.getClass(parseInt(classId));
      if (!classDetails) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Get user's purchased packages and find the specific one
      const userPackages = await storage.getUserPackagePurchases(req.user!.id);
      const userPackage = userPackages.find(pkg => pkg.id === parseInt(packageId));
      if (!userPackage) {
        return res.status(404).json({ message: "Package not found or not owned by user" });
      }

      // Get package details
      const packageDetails = await storage.getPackage(userPackage.packageId);
      if (!packageDetails) {
        return res.status(404).json({ message: "Package details not found" });
      }

      // Add package details to userPackage object for later use
      const enrichedUserPackage = { ...userPackage, packageDetails };
      
      // Check if package has remaining classes
      if (userPackage.remainingClasses < quantity) {
        return res.status(400).json({ 
          message: "Not enough classes remaining in package",
          remainingClasses: userPackage.remainingClasses
        });
      }
      
      // Validate package eligibility for this class
      let isEligible = false;
      
      // Check 1: Class must be from the same coach who created the package
      if (classDetails.coachId !== packageDetails.coachId) {
        return res.status(400).json({ 
          message: "This package can only be used for classes from the provider who created it"
        });
      }
      
      // Check 2: Class must be within the eligible classes scope
      const eligibleClasses = packageDetails.eligibleClasses;
      
      if (eligibleClasses === 'all') {
        // Package allows all classes from this coach
        isEligible = true;
      } else if (eligibleClasses) {
        try {
          // Parse the eligible classes JSON array
          const eligibleClassIds = JSON.parse(eligibleClasses);
          
          if (Array.isArray(eligibleClassIds)) {
            // Check if the class is eligible by ID or packageIdentifier
            isEligible = eligibleClassIds.includes(classDetails.id.toString()) || 
                        eligibleClassIds.includes(classDetails.recurringSeriesId || '');
          }
        } catch (error) {
          console.error('Error parsing eligible classes:', error);
          return res.status(400).json({ 
            message: "Package configuration error - invalid eligible classes format"
          });
        }
      }
      
      if (!isEligible) {
        return res.status(400).json({ 
          message: "This class is not eligible for your selected package. Please choose a different class or package."
        });
      }
      
      // Check capacity
      const existingBookings = await storage.getClassBookings(parseInt(classId));
      const confirmedBookings = existingBookings.filter(b => b.status === 'confirmed');
      const totalBookedSpots = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
      
      if (totalBookedSpots + quantity > classDetails.capacity) {
        return res.status(400).json({ 
          message: "Not enough spots available",
          availableSpots: classDetails.capacity - totalBookedSpots
        });
      }
      
      // Check if user already has a confirmed booking for this class
      const userBooking = existingBookings.find(b => b.userId === req.user!.id && b.status === 'confirmed');
      if (userBooking) {
        return res.status(400).json({ message: "You have already booked this class" });
      }
      
      // All package bookings use 'package' as payment method
      const paymentMethod = 'package';

      // Create confirmed booking
      const booking = await storage.createBooking({
        userId: req.user!.id,
        classId: parseInt(classId),
        quantity: quantity,
        status: 'confirmed',
        paymentMethod: paymentMethod
      });

      // Create package booking link
      await storage.createPackageBooking({
        packagePurchaseId: userPackage.id,
        bookingId: booking.id,
        bookingDate: new Date(),
        classDate: new Date(classDetails.startTime || new Date()),
        status: 'confirmed'
      });
      
      // Update package usage: increment usedClasses and decrement remainingClasses
      await storage.updatePackagePurchase(userPackage.id, {
        usedClasses: userPackage.usedClasses + quantity,
        remainingClasses: userPackage.remainingClasses - quantity
      });
      
      // Create scheduled payout for coach (always needed when booking is confirmed)
      const coach = await storage.getUser(classDetails.coachId);
      if (coach && coach.stripeConnectId) {
        const originalAmount = classDetails.price * quantity * 100; // Full class price in cents
        
        // Use package provider_per_class_amount instead of calculating 85% of class price
        const coachPayout = Math.round(parseFloat(userPackage.providerPerClassAmount || '0') * quantity * 100); // Provider's per-class amount in cents
        
        // Calculate payout date: 2 days after class end time
        const classEndTime = new Date(classDetails.endTime || classDetails.startTime);
        const payoutDate = new Date(classEndTime);
        payoutDate.setDate(payoutDate.getDate() + 2);
        
        await storage.createScheduledPayout({
          bookingId: booking.id,
          classId: parseInt(classId),
          coachId: classDetails.coachId,
          customerId: req.user!.id,
          stripePaymentIntentId: null, // No payment intent for package bookings
          amountCents: originalAmount,
          stripeFee: 0, // No stripe fee for package bookings
          netAmount: originalAmount,
          coachPayout: coachPayout,
          platformFee: 0,
          payoutType: 'package_usage',
          scheduledPayoutDate: payoutDate
        });
      }
      
      // Send confirmation email
      try {
        const coach = await storage.getUser(classDetails.coachId);
        if (coach) {
          const pricingDetails = {
            originalPrice: classDetails.price * quantity,
            discountAmount: classDetails.price * quantity, // Full amount is "discounted" since package was pre-paid
            finalAmount: 0, // Free since using package
            discountSource: `Package: ${enrichedUserPackage.packageDetails.title}`
          };
          
          await sendBookingConfirmation({
            booking,
            classData: classDetails,
            customer: req.user!,
            coach,
            pricingDetails: pricingDetails
          });
          
          const packageInfoForEmail = {
            isPackageBooking: true,
            perClassAmount: parseFloat(userPackage.providerPerClassAmount || '0'),
            packageTitle: enrichedUserPackage.packageDetails.title
          };
          
          // Send notification to coach with package information
          await sendNewBookingNotificationToCoach(
            coach,
            req.user!,
            classDetails,
            booking,
            packageInfoForEmail
          );

          // Send admin notification
          try {
            await sendBookingAdminNotification({
              booking,
              classData: classDetails,
              customer: req.user!,
              coach,
              bookingType: 'package',
              paymentAmount: 0
            });
          } catch (adminEmailError) {
            console.error("Admin notification error:", adminEmailError);
          }
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }

      // Update provider referral booking count for the coach
      try {
        await storage.updateProviderReferralBookingCount(classDetails.coachId);
        console.log(`Updated provider referral booking count for coach ${classDetails.coachId}`);
      } catch (providerReferralError) {
        console.error("Error updating provider referral booking count:", providerReferralError);
        // Don't fail the booking if provider referral update fails
      }
      
      res.json({ 
        success: true, 
        booking,
        message: `Class booking confirmed using your ${enrichedUserPackage.packageDetails.title} for ${quantity} spot(s)`,
        remainingClasses: userPackage.remainingClasses - quantity
      });
    } catch (error: any) {
      console.error("Error creating package booking:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Confirm payment and create confirmed booking
  app.post("/api/payment/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, classId, quantity = 1, appliedCredits = 0 } = req.body;
      
      if (!paymentIntentId || !classId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Validate class exists and check capacity
      const classItem = await storage.getClass(parseInt(classId));
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if class has capacity
      const classBookings = await storage.getClassBookings(parseInt(classId));
      const confirmedBookings = classBookings.filter(booking => 
        booking.status === "confirmed"
      );
      
      if (confirmedBookings.length >= classItem.capacity) {
        return res.status(400).json({ message: "Class is fully booked" });
      }
      
      // Determine payment method from Stripe PaymentIntent if available
      let paymentMethod = "stripe";
      if (stripe && paymentIntentId && paymentIntentId.startsWith("pi_")) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.payment_method) {
            const paymentMethodObj = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
            paymentMethod = paymentMethodObj.type || "stripe";
          }
        } catch (stripeError) {
          // Use default payment method
        }
      }

      // Check for promo code usage from payment intent metadata
      let promoCodeUsed = null;
      let paymentIntent = null;
      if (stripe && paymentIntentId && paymentIntentId.startsWith("pi_")) {
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.metadata?.promoCode) {
            const promoCode = await storage.getPromoCodeByCode(paymentIntent.metadata.promoCode);
            if (promoCode) {
              promoCodeUsed = promoCode;
            }
          }
        } catch (stripeError) {
          // Could not retrieve promo code
        }
      }

      // Create new confirmed booking directly (no pending status)
      const booking = await storage.createBooking({
        userId: req.user.id,
        classId: parseInt(classId),
        quantity: quantity,
        status: "confirmed",
        stripePaymentIntentId: paymentIntentId,
        paymentDate: new Date(),
        paymentMethod: paymentMethod
      });

      // Record promo code usage if one was used
      if (promoCodeUsed && paymentIntent) {
        try {
          const originalClassPrice = parseFloat(paymentIntent.metadata?.originalAmount || '0') * 100; // in cents
          
          // Calculate the actual discount applied to the class price
          const discountCalc = await storage.calculateDiscount(promoCodeUsed, originalClassPrice);
          const actualDiscountAmount = discountCalc.discountAmount; // This is the true 20% discount
          
          // Calculate subsidy amount: difference in what coach receives between original and discounted price
          let subsidyAmount = 0;
          if (promoCodeUsed.platformSubsidized) {
            // Original coach payout calculation
            const originalWithFee = originalClassPrice * 1.05; // Add 5% service fee
            const originalStripeFee = Math.round(originalWithFee * 0.029) + 30; // 2.9% + $0.30
            const originalNetAmount = originalWithFee - originalStripeFee;
            const originalCoachPayout = Math.round(originalNetAmount * 0.85); // 85% to coach
            
            // Discounted coach payout calculation
            const discountedPrice = originalClassPrice - actualDiscountAmount;
            const discountedWithFee = discountedPrice * 1.05; // Add 5% service fee
            const discountedStripeFee = Math.round(discountedWithFee * 0.029) + 30; // 2.9% + $0.30
            const discountedNetAmount = discountedWithFee - discountedStripeFee;
            const discountedCoachPayout = Math.round(discountedNetAmount * 0.85); // 85% to coach
            
            // Subsidy is the difference in coach payouts
            subsidyAmount = originalCoachPayout - discountedCoachPayout;
          }

          await storage.recordPromoCodeUsage({
            promoCodeId: promoCodeUsed.id,
            userId: req.user.id,
            bookingId: booking.id,
            discountAmount: actualDiscountAmount,
            subsidyAmount
          });
        } catch (promoError) {
          console.error("Error recording promo code usage:", promoError);
        }
      }
      
      // AUTO-DETECT AND APPLY CREDIT DEDUCTION FOR REFERRAL USERS
      // This ensures ALL referral users get their credits properly deducted
      const userCreditBalance = await storage.getUserCreditBalance(req.user.id);
      const userReferralStatus = await storage.getUserReferralStatus(req.user.id);
      const userBookings = await storage.getUserBookings(req.user.id);
      
      // Check if this is a first-time referral user with credits who should get automatic deduction
      const isFirstTimeReferralUser = userReferralStatus?.status === 'signed_up';
      const completedBookings = userBookings.filter((b: any) => b.status === 'confirmed');
      const isFirstPaidBooking = completedBookings.length === 0; // This booking will be their first
      const hasCreditsToApply = userCreditBalance > 0;
      
      // Process credits that were applied by frontend OR auto-apply for first-time referral users
      let actualCreditsToDeduct = appliedCredits;
      
      // If frontend applied credits, use those
      if (appliedCredits > 0) {
        actualCreditsToDeduct = appliedCredits;
      }
      // Otherwise, auto-apply for first-time referral users
      else if (isFirstTimeReferralUser && isFirstPaidBooking && hasCreditsToApply) {
        // Frontend didn't apply credits but user should get them automatically
        actualCreditsToDeduct = Math.min(userCreditBalance, paymentIntent.amount); // Apply up to full amount or balance
      }

      // Process credit deduction if credits should be applied
      if (actualCreditsToDeduct > 0) {
        try {
          // Check user balance before deduction
          const balanceBefore = await storage.getUserCreditBalance(req.user.id);
          
          await storage.applyCreditsToBooking(req.user.id, actualCreditsToDeduct, booking.id);
          
          // Verify balance after deduction
          const balanceAfter = await storage.getUserCreditBalance(req.user.id);
          
          // Ensure credit deduction worked properly
          if ((balanceBefore - balanceAfter) !== actualCreditsToDeduct) {
            console.error("⚠️ WARNING: Credit deduction mismatch!");
            console.error("Expected difference:", actualCreditsToDeduct);
            console.error("Actual difference:", balanceBefore - balanceAfter);
          }
          
          // CREATE PLATFORM SUBSIDY for referral credits (like promo codes)
          // This ensures coaches get paid the full amount while Trainn covers the credit difference
          if (paymentIntent && paymentIntent.metadata) {
            const originalClassPrice = parseFloat(paymentIntent.metadata.originalAmount || '0') * 100; // in cents
            
            // Calculate subsidy amount using your exact formula:
            // [$15 *1.05 - 0.30 - (15*1.05 * 2.9%) * 85% ] - [$10*1.05 - $0.3 - ($10*1.05*2.9%) * 85%]
            
            // Original class calculation (in cents)
            const originalBaseCents = originalClassPrice; // Already in cents
            const originalWithFeeCents = Math.round(originalBaseCents * 1.05); // Add 5% service fee
            const originalStripeFee = Math.round(originalWithFeeCents * 0.029) + 30; // 2.9% + $0.30
            const originalNetCents = originalWithFeeCents - originalStripeFee;
            const originalCoachPayout = Math.round(originalNetCents * 0.85); // 85% to coach
            
            // Credit-discounted calculation (in cents) 
            const discountedBaseCents = originalClassPrice - actualCreditsToDeduct;
            const discountedWithFeeCents = Math.round(discountedBaseCents * 1.05); // Add 5% service fee
            const discountedStripeFee = Math.round(discountedWithFeeCents * 0.029) + 30; // 2.9% + $0.30
            const discountedNetCents = discountedWithFeeCents - discountedStripeFee;
            const discountedCoachPayout = Math.round(discountedNetCents * 0.85); // 85% to coach
            
            // Platform subsidy = difference in coach payouts (what Trainn pays to make coach whole)
            const subsidyAmount = originalCoachPayout - discountedCoachPayout;
            
            // Note: Credit subsidy calculation is now handled in storage.calculateCreditSubsidyForBooking()
            // This ensures coaches get paid the full amount when credits are used
          }
        } catch (creditError) {
          console.error("Error processing credits/subsidy:", creditError);
          // Don't fail the booking if credit processing fails, but log the error
        }
      }
      
      console.log("Booking created successfully:", booking);
      
      // NOTE: Referral rewards are now handled by the automated payout processor
      // to prevent duplicate credits and ensure proper timing after class completion
      
      // Create scheduled payout for coach (2 days after class completion)
      if (stripe && paymentIntentId && paymentIntentId.startsWith("pi_")) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.metadata) {
            const metadata = paymentIntent.metadata;
            
            // Calculate the scheduled payout date: 2 days after class completion
            const classEndTime = new Date(classItem.endTime);
            const payoutDate = new Date(classEndTime);
            payoutDate.setDate(payoutDate.getDate() + 2);
            
            // CRITICAL FIX: Calculate payout based on ORIGINAL class price, not reduced amount
            // When credits are used, coach should still get full payout (platform subsidizes)
            let payoutAmountCents, payoutStripeFee, payoutNetAmount, finalCoachPayout, finalPlatformFee;
            
            if (actualCreditsToDeduct > 0) {
              // Get original and reduced amounts
              const originalClassPrice = parseFloat(metadata.originalAmount || '0') * 100; // in cents
              const originalWithFee = Math.round(originalClassPrice * 1.05); // Add 5% service fee
              const originalStripeFee = Math.round(originalWithFee * 0.029) + 30; // 2.9% + $0.30
              const originalNetAmount = originalWithFee - originalStripeFee;
              const fullCoachPayout = Math.round(originalNetAmount * 0.85); // 85% to coach
              
              // Calculate what customer actually paid (from payment intent)
              const customerPaidAmount = parseInt(metadata.amount || '0'); // What customer was charged
              const customerStripeFee = parseInt(metadata.stripeFee || '0');
              const customerNetAmount = parseInt(metadata.netAmount || '0');
              const customerPortionCoachPayout = parseInt(metadata.coachPayout || '0');
              const customerPortionPlatformFee = parseInt(metadata.platformFee || '0');
              
              // Calculate platform subsidy amount
              const platformSubsidyPayout = fullCoachPayout - customerPortionCoachPayout;
              
              // Create first payout: Customer-paid portion
              await storage.createScheduledPayout({
                bookingId: booking.id,
                classId: parseInt(classId),
                coachId: classItem.coachId,
                customerId: req.user.id,
                stripePaymentIntentId: paymentIntentId,
                amountCents: customerPaidAmount,
                stripeFee: customerStripeFee,
                netAmount: customerNetAmount,
                coachPayout: customerPortionCoachPayout,
                platformFee: customerPortionPlatformFee,
                scheduledPayoutDate: payoutDate,
                status: 'scheduled',
                payoutType: 'booking'
              });
              
              // Create second payout: Platform subsidy for credits
              if (platformSubsidyPayout > 0) {
                await storage.createScheduledPayout({
                  bookingId: booking.id,
                  classId: parseInt(classId),
                  coachId: classItem.coachId,
                  customerId: req.user.id,
                  stripePaymentIntentId: null, // No payment intent for subsidy
                  amountCents: originalWithFee, // Keep original amount for reference
                  stripeFee: 0, // No stripe fee for subsidy
                  netAmount: platformSubsidyPayout, // Net is the subsidy amount
                  coachPayout: platformSubsidyPayout,
                  platformFee: 0, // No platform fee for subsidy
                  scheduledPayoutDate: payoutDate,
                  status: 'scheduled',
                  payoutType: 'platform_subsidy_promo_credit'
                });
              }
              
            } else {
              // No credits used, use standard calculation
              payoutAmountCents = parseInt(metadata.amount || '0');
              payoutStripeFee = parseInt(metadata.stripeFee || '0');
              payoutNetAmount = parseInt(metadata.netAmount || '0');
              finalCoachPayout = parseInt(metadata.coachPayout || '0');
              finalPlatformFee = parseInt(metadata.platformFee || '0');
              
              // Create single scheduled payout record for non-credit bookings
              await storage.createScheduledPayout({
                bookingId: booking.id,
                classId: parseInt(classId),
                coachId: classItem.coachId,
                customerId: req.user.id,
                stripePaymentIntentId: paymentIntentId,
                amountCents: payoutAmountCents,
                stripeFee: payoutStripeFee,
                netAmount: payoutNetAmount,
                coachPayout: finalCoachPayout,
                platformFee: finalPlatformFee,
                scheduledPayoutDate: payoutDate,
                status: 'scheduled'
              });
            }
          }
        } catch (error) {
          console.error("Error creating scheduled payout:", error);
          // Don't fail the booking if payout scheduling fails
        }
      }
      
      const updatedBookings = [booking];
      const totalQuantity = quantity;
      
      // Send confirmation email after successful booking
      try {
        if (!req.user) {
          console.warn("No user found for email confirmation");
        } else {
          // Get class details for email
          const classDetails = await storage.getClass(parseInt(classId));
          if (classDetails) {
            // Get coach details
            const coach = await storage.getUser(classDetails.coachId);
            if (coach) {
              // Use the first confirmed booking for email data
              const confirmedBooking = updatedBookings.find(b => b?.status === "confirmed");
              if (confirmedBooking) {
                // Calculate pricing details for email
                let pricingDetails = undefined;
                if (paymentIntent && paymentIntent.metadata) {
                  const originalAmount = parseFloat(paymentIntent.metadata.originalAmount || '0');
                  const chargedAmount = paymentIntent.amount / 100; // Convert from cents to dollars
                  const discountAmount = originalAmount - chargedAmount;
                  
                  if (discountAmount > 0) {
                    let discountSource = "Discount";
                    
                    // Determine discount source
                    if (appliedCredits > 0) {
                      discountSource = "Referral Credit";
                    } else if (paymentIntent.metadata.promoCode) {
                      discountSource = "Promo Code";
                    }
                    
                    pricingDetails = {
                      originalPrice: originalAmount,
                      discountAmount: discountAmount,
                      finalAmount: chargedAmount,
                      discountSource: discountSource
                    };
                  }
                }
                
                const emailSent = await sendBookingConfirmation({
                  booking: confirmedBooking,
                  classData: classDetails,
                  customer: req.user,
                  coach: coach,
                  pricingDetails: pricingDetails
                });
                
                if (emailSent) {
                  console.log(`Confirmation email sent to ${req.user.email} for class ${classDetails.title}`);
                } else {
                  console.warn(`Failed to send confirmation email to ${req.user.email}`);
                }

                // Send new booking notification to coach
                await sendNewBookingNotificationToCoach(
                  coach,
                  req.user,
                  classDetails,
                  confirmedBooking
                );

                // Send admin notification
                try {
                  await sendBookingAdminNotification({
                    booking: confirmedBooking,
                    classData: classDetails,
                    customer: req.user,
                    coach,
                    bookingType: 'paid',
                    paymentAmount: paymentIntent?.amount || 0
                  });
                } catch (adminEmailError) {
                  console.error("Admin notification error:", adminEmailError);
                }
              }
            }
          }
        }
      } catch (emailError) {
        // Don't fail the booking if email fails
        console.error("Email sending error:", emailError);
      }

      // Update provider referral booking count for the coach
      try {
        await storage.updateProviderReferralBookingCount(classItem.coachId);
        console.log(`Updated provider referral booking count for coach ${classItem.coachId}`);
      } catch (providerReferralError) {
        console.error("Error updating provider referral booking count:", providerReferralError);
        // Don't fail the booking if provider referral update fails
      }
      
      res.json({ 
        success: true, 
        bookings: updatedBookings,
        quantity: totalQuantity,
        message: `Booking confirmed successfully for ${totalQuantity} spot(s)` 
      });
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Package Payment API endpoints
  app.post("/api/package-payment/create-intent", requireAuth, async (req, res) => {
    try {
      const { packageId, classCount, price, appliedCredits = 0, promoCode } = req.body;
      
      if (!packageId || !classCount || !price) {
        return res.status(400).json({ message: "Missing required parameters: packageId, classCount, price" });
      }

      // Get package details for validation
      const packageData = await storage.getPackage(parseInt(packageId));
      if (!packageData) {
        return res.status(404).json({ message: "Package not found" });
      }

      let packagePrice = parseFloat(price);
      
      // Add 5% processing fee to package price
      const processingFee = packagePrice * 0.05;
      let finalAmount = packagePrice + processingFee;
      
      // Apply credits if specified
      if (appliedCredits > 0) {
        finalAmount = Math.max(0, finalAmount - (appliedCredits / 100)); // Credits are in cents
      }

      // If amount is 0 (fully covered by credits), don't create payment intent
      if (finalAmount === 0) {
        return res.json({
          clientSecret: null,
          finalAmount: 0,
          requiresPayment: false
        });
      }

      // Create Stripe PaymentIntent
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100), // Convert to cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          packageId: packageId.toString(),
          classCount: classCount.toString(),
          userId: req.user.id.toString(),
          originalPrice: price.toString(),
          appliedCredits: appliedCredits.toString(),
          promoCode: promoCode || ""
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        finalAmount: finalAmount,
        requiresPayment: true
      });

    } catch (error: any) {
      console.error("Error creating package payment intent:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent",
        error: error.message 
      });
    }
  });

  app.post("/api/package-payment/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, packageId, classCount, price, promoCode, appliedCredits = 0 } = req.body;
      
      if (!packageId || !classCount || !price) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      console.log("=== CONFIRMING PACKAGE PURCHASE ===");
      console.log("Package ID:", packageId);
      console.log("Class Count:", classCount);
      console.log("Price:", price);
      console.log("User ID:", req.user.id);

      // Get package details
      const packageData = await storage.getPackage(parseInt(packageId));
      if (!packageData) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Verify payment with Stripe if paymentIntentId exists
      let stripePaymentIntent = null;
      if (paymentIntentId) {
        stripePaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (stripePaymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            message: "Payment not completed", 
            status: stripePaymentIntent.status 
          });
        }
      }

      // Calculate financial details - ensure we use the same pricing logic as payment creation
      const packagePrice = parseFloat(price);
      const processingFee = packagePrice * 0.05;
      const totalAmountDollarsFromPrice = packagePrice + processingFee;
      
      // Use the actual charged amount from Stripe if available, otherwise calculate it
      const totalAmountCents = stripePaymentIntent ? stripePaymentIntent.amount : Math.round(totalAmountDollarsFromPrice * 100);
      const totalAmountDollars = totalAmountCents / 100;
      
      // Calculate Stripe fee (2.9% + 30¢ for US cards)
      const stripeFee = stripePaymentIntent ? Math.round(totalAmountCents * 0.029 + 30) / 100 : 0;
      const netAmount = totalAmountDollars - stripeFee;
      
      // Calculate platform fee (15% of net amount after Stripe fees)
      const platformFee = netAmount * 0.15;
      
      // Calculate provider amounts - all based on net amount for consistency
      const totalProviderAmount = netAmount * 0.85; // 85% of net_amount
      const firstProviderPayout = totalProviderAmount * 0.25; // 25% of total provider amount
      const remainingProviderAmount = totalProviderAmount - firstProviderPayout; // total_provider_amount - first_provider_payout
      const providerPerClassAmount = remainingProviderAmount / parseInt(classCount); // remaining_provider_amount / class_count

      // Create package purchase record
      const packagePurchase = await storage.createPackagePurchase({
        userId: req.user.id,
        packageId: parseInt(packageId),
        packageType: packageData.packageType,
        classCount: parseInt(classCount),
        price: totalAmountDollars.toString(),
        currency: "usd",
        paymentIntentId: paymentIntentId || null,
        paymentMethod: "stripe",
        paymentStatus: "completed",
        stripeFee: stripeFee.toString(),
        netAmount: netAmount.toString(),
        platformFee: platformFee.toString(),
        firstProviderPayout: firstProviderPayout.toString(),
        totalProviderAmount: totalProviderAmount.toString(),
        remainingProviderAmount: remainingProviderAmount.toString(),
        providerPerClassAmount: providerPerClassAmount.toString(),
        firstProviderPayoutStatus: "pending",
        payoutDate: null,
        usedClasses: 0,
        remainingClasses: parseInt(classCount),
        expirationDate: packageData.packageType === 'set_pack' && parseInt(classCount) === 5 
          ? new Date(new Date().getFullYear(), new Date().getMonth() + 2, new Date().getDate())
          : packageData.packageType === 'set_pack' && parseInt(classCount) === 10
          ? new Date(new Date().getFullYear(), new Date().getMonth() + 3, new Date().getDate())
          : packageData.packageType === 'set_pack' && parseInt(classCount) === 20
          ? new Date(new Date().getFullYear(), new Date().getMonth() + 6, new Date().getDate())
          : null
      });

      console.log(`✅ Package purchase saved with ID: ${packagePurchase.id}`);

      // Create scheduled payout for package purchase (24 hours after purchase)
      const scheduledPayoutDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 hours
      
      try {
        const scheduledPayout = await storage.createScheduledPayout({
          packagePurchasesId: packagePurchase.id,
          classPackageId: parseInt(packageId), // Track which package was purchased
          bookingId: null, // No specific booking for package purchase
          classId: null, // No specific class for package purchase
          coachId: packageData.coachId,
          customerId: req.user.id,
          stripePaymentIntentId: paymentIntentId || null,
          amountCents: Math.round(totalAmountDollars * 100), // Convert to cents
          stripeFee: Math.round(stripeFee * 100), // Convert to cents
          netAmount: Math.round(netAmount * 100), // Convert to cents
          coachPayout: Math.round(firstProviderPayout * 100), // Convert to cents
          platformFee: Math.round(platformFee * 100), // Convert to cents
          payoutType: "package_purchase",
          providerReferralId: null,
          scheduledPayoutDate: scheduledPayoutDate,
          status: "scheduled",
          stripeTransferId: null,
          completedAt: null,
          failureReason: null
        });
      } catch (scheduledPayoutError: any) {
        console.error("❌ Error creating scheduled payout for package purchase:", scheduledPayoutError);
        // Don't fail the entire request, but log the error
      }

      // Apply account credits if used
      if (appliedCredits > 0) {
        try {
          await storage.addCredit(req.user.id, -appliedCredits, `Package purchase: ${packageData.title}`);
        } catch (error) {
          console.error("Error applying credits:", error);
        }
      }

      // Send email notifications
      try {
        // Get customer and coach user data for emails
        const customer = req.user;
        const coach = await storage.getUser(packageData.coachId);
        
        if (coach) {
          // Prepare pricing details for customer email
          const pricingDetails = {
            originalPrice: packagePrice,
            discountAmount: 0, // No discount for paid purchases currently
            finalAmount: totalAmountDollars,
            stripeFee: stripeFee,
            appliedCredits: appliedCredits || undefined
          };

          // Prepare provider pricing details 
          const providerPricingDetails = {
            coachPayout: firstProviderPayout,
            totalAmount: totalAmountDollars
          };

          // Send customer confirmation email
          await sendPackagePurchaseConfirmation({
            packagePurchase,
            packageDetails: packageData,
            customer,
            coach,
            pricingDetails
          });

          // Send provider notification email
          await sendPackagePurchaseNotification({
            packagePurchase,
            packageDetails: packageData,
            customer,
            coach,
            pricingDetails: providerPricingDetails
          });
        }
      } catch (emailError) {
        console.error("Error sending package purchase emails:", emailError);
        // Don't fail the entire request for email errors
      }

      res.json({ 
        success: true, 
        message: "Package purchase confirmed and saved",
        packageId: packageId,
        classCount: classCount,
        purchaseId: packagePurchase.id,
        remainingClasses: packagePurchase.remainingClasses
      });

    } catch (error: any) {
      console.error("Error confirming package purchase:", error);
      res.status(500).json({ 
        message: "Failed to confirm package purchase",
        error: error.message 
      });
    }
  });

  // Free package purchase with credits
  app.post("/api/package-payment/free-credit", requireAuth, async (req, res) => {
    try {
      const { packageId, classCount, price, appliedCredits } = req.body;
      const userId = (req.user as any).id;
      
      if (!packageId || !classCount || !price || !appliedCredits) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Get package details for validation
      const packageData = await storage.getPackage(parseInt(packageId));
      if (!packageData) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Get user's current credit balance
      const userCredits = await storage.getUserCredits(userId);
      const totalCredits = userCredits.reduce((sum, credit) => sum + parseInt(credit.amount), 0);
      
      // Check if user has enough credits
      if (totalCredits < appliedCredits) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Create package purchase record
      const purchaseData = {
        userId: userId,
        packageId: parseInt(packageId),
        packageType: packageData.packageType,
        classCount: classCount,
        price: price.toString(),
        currency: 'usd',
        paymentMethod: 'credits',
        paymentStatus: 'completed' as const,
        purchaseDate: new Date(),
      };

      const packagePurchase = await storage.createPackagePurchase(purchaseData);

      // Apply credits to this purchase
      await storage.applyCreditsToBooking(userId, appliedCredits, packagePurchase.id);

      // Send email notifications for free credit purchase
      try {
        // Get customer and coach user data for emails
        const customer = req.user;
        const coach = await storage.getUser(packageData.coachId);
        
        if (coach) {
          // Prepare pricing details for customer email
          const pricingDetails = {
            originalPrice: parseFloat(price),
            discountAmount: 0,
            finalAmount: 0, // Paid with credits, so final amount is $0
            stripeFee: 0,
            appliedCredits: appliedCredits
          };

          // For free credit purchases, coach gets no immediate payout (fully subsidized by platform)
          const providerPricingDetails = {
            coachPayout: 0, // Will be paid when classes are attended
            totalAmount: 0
          };

          // Send customer confirmation email
          await sendPackagePurchaseConfirmation({
            packagePurchase,
            packageDetails: packageData,
            customer,
            coach,
            pricingDetails
          });

          // Send provider notification email
          await sendPackagePurchaseNotification({
            packagePurchase,
            packageDetails: packageData,
            customer,
            coach,
            pricingDetails: providerPricingDetails
          });
        }
      } catch (emailError) {
        console.error("Error sending package purchase emails:", emailError);
        // Don't fail the entire request for email errors
      }

      res.json({
        success: true,
        message: `Successfully purchased ${classCount} classes using account credits`,
        packagePurchaseId: packagePurchase.id
      });

    } catch (error: any) {
      console.error("Free credit package purchase error:", error);
      res.status(500).json({ 
        message: "Failed to process free credit purchase", 
        error: error.message 
      });
    }
  });

  // Time-Bound Package Payment API endpoints
  app.post("/api/time-bound-package-payment/create-intent", requireAuth, async (req, res) => {
    try {
      const { packageId, quantity = 1, promoCode, useCredits = false, appliedCredits = 0 } = req.body;
      
      if (!packageId) {
        return res.status(400).json({ message: "Missing required parameter: packageId" });
      }

      // Get package details with sessions
      const packageData = await storage.getTimeBoundPackageWithSessions(parseInt(packageId));
      if (!packageData || !packageData.package) {
        return res.status(404).json({ message: "Package not found" });
      }

      const pkg = packageData.package;
      let pricePerSpot = pkg.price || 0;
      
      // Calculate prorated price if late join is allowed
      if (pkg.allowLateJoin && packageData.sessions) {
        const now = new Date();
        const passedSessions = packageData.sessions.filter(s => new Date(s.date) < now);
        const remainingSessions = packageData.sessions.length - passedSessions.length;
        const totalSessions = packageData.sessions.length;
        
        if (remainingSessions < totalSessions && remainingSessions > 0) {
          pricePerSpot = (pkg.price || 0) * (remainingSessions / totalSessions);
        }
      }
      
      // Calculate base amount for total quantity
      let baseAmount = pricePerSpot * quantity;
      const baseAmountCents = Math.round(baseAmount * 100);
      let finalAmountCents = baseAmountCents;
      
      let promoCodeData = null;
      let discountAmount = 0;
      let subsidyAmount = 0;
      
      // Validate and apply promo code if provided
      if (promoCode) {
        const validation = await storage.validatePromoCodeForPackage(promoCode, req.user.id, parseInt(packageId), quantity);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error || "Invalid promo code" });
        }
        promoCodeData = validation.promoCode;
        
        const discountCalc = await storage.calculateDiscount(promoCodeData, baseAmountCents);
        discountAmount = discountCalc.discountAmount;
        subsidyAmount = discountCalc.subsidyAmount;
        finalAmountCents -= discountAmount;
      }
      
      // Apply credits if requested
      if (useCredits && appliedCredits > 0) {
        const userCreditBalance = await storage.getUserCreditBalance(req.user.id);
        if (userCreditBalance < appliedCredits) {
          return res.status(400).json({ message: "Insufficient credits" });
        }
        finalAmountCents = Math.max(0, finalAmountCents - appliedCredits);
      }
      
      // Calculate 5% processing fee on amount after discounts/credits
      const subtotalCents = finalAmountCents; // Amount before processing fee
      const processingFeeCents = Math.round(subtotalCents * 0.05);
      const totalAmountCents = subtotalCents + processingFeeCents;
      
      // If final amount is $0, don't create payment intent
      if (totalAmountCents <= 0) {
        return res.json({
          clientSecret: null,
          subtotal: 0,
          stripeFee: 0,
          totalAmount: 0,
          unitPriceCents: Math.round(pricePerSpot * 100), // Convert to cents for consistency
          requiresPayment: false,
          message: "No payment required - booking covered by promo/credits"
        });
      }

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: "usd",
        metadata: {
          packageId: packageId.toString(),
          packageType: 'time_bound',
          userId: req.user.id.toString(),
          quantity: quantity.toString(),
          promoCode: promoCode || '',
          promoCodeId: promoCodeData?.id?.toString() || '',
          discountApplied: promoCodeData ? 'true' : 'false',
          appliedCredits: appliedCredits.toString(),
          creditsUsed: useCredits ? 'true' : 'false',
          originalAmount: baseAmountCents.toString(),
          subsidyAmount: subsidyAmount.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        subtotal: subtotalCents,
        stripeFee: processingFeeCents,
        totalAmount: totalAmountCents,
        unitPriceCents: Math.round(pricePerSpot * 100), // Convert to cents for consistency
        requiresPayment: true
      });

    } catch (error: any) {
      console.error("Error creating time-bound package payment intent:", error);
      res.status(500).json({ 
        message: "Failed to create payment intent", 
        error: error.message 
      });
    }
  });

  // Scheduled Payout Management Routes
  
  // Process due payouts (admin only)
  app.post("/api/admin/process-payouts", requireAdmin, async (req, res) => {
    try {
      const { payoutProcessor } = await import('./payout-processor');
      const results = await payoutProcessor.processDuePayouts();
      
      res.json({
        success: true,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      });
    } catch (error: any) {
      console.error("Error processing payouts:", error);
      res.status(500).json({ message: error.message });
    }
  });
  


  // Test endpoint to send confirmation email with new format
  app.post("/api/test/send-confirmation-email", async (req, res) => {
    try {
      // Create test data for confirmation email
      const testBooking = {
        id: 999,
        quantity: 1,
        status: 'confirmed' as const
      };
      
      const testClassData = {
        id: 123,
        title: "Morning Yoga Flow (Test)",
        description: "A relaxing morning yoga session to start your day right",
        startTime: new Date('2025-08-02T08:00:00-08:00'),
        endTime: new Date('2025-08-02T09:00:00-08:00'),
        address: "Golden Gate Park, San Francisco, CA",
        whatToBring: "Yoga mat and water bottle",
        price: 15.00,
        coachId: 456,
        categoryId: 1,
        capacity: 20,
        image: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const testCustomer = {
        id: 123,
        email: "kseniya.kapytouskaya+5c@gmail.com",
        firstName: "Kseniya",
        lastName: "Test",
        username: "kseniya_test",
        password: "test",
        role: 'customer' as const,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const testCoach = {
        id: 456,
        firstName: "Sarah",
        lastName: "Johnson",
        email: "coach@example.com",
        username: "sarah_coach",
        password: "test",
        role: 'coach' as const,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Test pricing details for new user scenario: $15 class + $0.75 service fee - $10 referral credit = $5.75
      const classPrice = 15.00;
      const serviceFee = 0.75;
      const originalTotal = classPrice + serviceFee; // $15.75
      const referralDiscount = 10.00;
      const finalAmount = originalTotal - referralDiscount; // $5.75
      
      const testPricingDetails = {
        originalPrice: originalTotal,
        discountAmount: referralDiscount,
        finalAmount: finalAmount,
        discountSource: "Referral Credit"
      };

      const emailSent = await sendBookingConfirmation({
        booking: testBooking,
        classData: testClassData,
        customer: testCustomer,
        coach: testCoach,
        pricingDetails: testPricingDetails
      });

      if (emailSent) {
        res.json({ 
          success: true, 
          message: 'Test confirmation email sent successfully to kseniya.kapytouskaya+5c@gmail.com',
          details: 'Email shows "Total Paid: $10.00" with new simplified format'
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send test email' 
        });
      }
    } catch (error: any) {
      console.error("Test email error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  // Test endpoint for post-class feedback email (development only)
  app.post("/api/test/send-feedback-email", async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (bookingId) {
        // Use real booking data from database
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ 
            success: false, 
            message: 'Booking not found' 
          });
        }
        
        const classData = await storage.getClass(booking.classId);
        const customer = await storage.getUser(booking.userId);
        const coach = classData ? await storage.getUser(classData.coachId) : null;
        
        if (!classData || !customer || !coach) {
          return res.status(404).json({ 
            success: false, 
            message: 'Missing required data for email' 
          });
        }
        
        const { sendPostClassFeedbackEmail } = await import('./email');
        const emailSent = await sendPostClassFeedbackEmail({
          booking,
          classData,
          customer,
          coach
        });
        
        if (emailSent) {
          res.json({ 
            success: true, 
            message: `Post-class feedback email sent successfully to ${customer.email}`,
            details: {
              customerName: customer.firstName,
              className: classData.title,
              coachName: coach.firstName,
              to: customer.email
            }
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: 'Failed to send feedback email' 
          });
        }
      } else {
        // Use test data if no bookingId provided
        const testCustomer = {
          id: 123,
          firstName: "Carlos",
          email: "charleslozano@gmail.com",
          lastName: "Test",
          username: "carlos_test",
          password: "test",
          role: 'customer' as const,
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const testClassData = {
          id: 626,
          title: "Boot Camp @ Dolores Park",
          description: "High-intensity outdoor workout session",
          startTime: new Date('2025-09-24T14:00:00-08:00'),
          endTime: new Date('2025-09-24T15:00:00-08:00'),
          address: "Dolores Park, San Francisco, CA",
          whatToBring: "Water bottle and towel",
          price: 25.00,
          coachId: 456,
          categoryId: 1,
          capacity: 20,
          image: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const testCoach = {
          id: 456,
          firstName: "Maria",
          lastName: "Rodriguez",
          email: "coach@example.com",
          username: "maria_coach",
          password: "test",
          role: 'coach' as const,
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const testBooking = {
          id: 320,
          userId: testCustomer.id,
          classId: testClassData.id,
          quantity: 1,
          status: "confirmed" as const,
          stripePaymentIntentId: "test_pi_" + Date.now(),
          paymentDate: new Date(),
          paymentMethod: "stripe" as const,
          amount: testClassData.price * 100,
          currency: "usd",
          platformFee: Math.round(testClassData.price * 100 * 0.15),
          coachPayout: Math.round(testClassData.price * 100 * 0.85),
          createdAt: new Date(),
          stripePaymentId: null,
          stripeTransferId: null,
          payoutStatus: null,
          payoutDate: null
        };

        const { sendPostClassFeedbackEmail } = await import('./email');
        const emailSent = await sendPostClassFeedbackEmail({
          booking: testBooking,
          classData: testClassData,
          customer: testCustomer,
          coach: testCoach
        });

        if (emailSent) {
          res.json({ 
            success: true, 
            message: 'Test post-class feedback email sent successfully to charleslozano@gmail.com',
            details: {
              customerName: testCustomer.firstName,
              className: testClassData.title,
              coachName: testCoach.firstName,
              to: testCustomer.email
            }
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: 'Failed to send test feedback email' 
          });
        }
      }
    } catch (error: any) {
      console.error("Test feedback email error:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test feedback email',
        error: error.message
      });
    }
  });

  // Test weekly newsletter endpoints
  app.post("/api/test/send-weekly-newsletter", async (req, res) => {
    try {
      const { sendWeeklyNewsletters } = await import('./email-scheduler');
      await sendWeeklyNewsletters();
      
      res.json({ 
        success: true, 
        message: 'Weekly newsletter sent successfully to all customers' 
      });
    } catch (error: any) {
      console.error("Weekly newsletter test error:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send weekly newsletter',
        error: error.message
      });
    }
  });
  
  // Send weekly newsletter to specific customer (for testing)
  app.post("/api/test/send-newsletter-to-customer", async (req, res) => {
    try {
      const { customerEmail } = req.body;
      
      if (!customerEmail) {
        return res.status(400).json({
          success: false,
          message: "customerEmail is required"
        });
      }

      // Get customer by email
      const customer = await storage.getUserByEmail(customerEmail);
      if (!customer || customer.role !== 'customer') {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      // Fetch newsletter data
      const [upcomingKidsClasses, upcomingAdultClasses, newProviders, recentReviews] = await Promise.all([
        storage.getUpcomingKidsClassesForNewsletter(),
        storage.getUpcomingAdultClassesForNewsletter(), 
        storage.getRecentlyJoinedProviders(30),
        storage.getRecentReviewsForNewsletter()
      ]);

      const { sendWeeklyNewsletterEmail } = await import('./email');
      const emailSent = await sendWeeklyNewsletterEmail({
        customer,
        upcomingKidsClasses,
        upcomingAdultClasses,
        newProviders,
        recentReviews
      });

      if (emailSent) {
        res.json({ 
          success: true, 
          message: `Weekly newsletter sent successfully to ${customerEmail}`,
          details: {
            customerName: customer.firstName,
            kidsClasses: upcomingKidsClasses.length,
            adultClasses: upcomingAdultClasses.length,
            newProviders: newProviders.length,
            reviews: recentReviews.length
          }
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: `Failed to send newsletter to ${customerEmail}` 
        });
      }
    } catch (error: any) {
      console.error("Customer newsletter test error:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send newsletter to customer',
        error: error.message
      });
    }
  });

  // Get newsletter data preview (for debugging)
  app.get("/api/test/newsletter-data", async (req, res) => {
    try {
      // Test simple queries first
      const allClasses = await db.select({ 
        id: classes.id, 
        title: classes.title, 
        ageGroup: classes.ageGroup, 
        status: classes.status,
        startTime: classes.startTime,
        coachId: classes.coachId
      }).from(classes).limit(5);
      
      const allUsers = await db.select({ 
        id: users.id, 
        firstName: users.firstName, 
        role: users.role, 
        isApproved: users.isApproved 
      }).from(users).limit(5);

      res.json({ 
        success: true, 
        debug: {
          totalClasses: allClasses.length,
          totalUsers: allUsers.length,
          sampleClasses: allClasses,
          sampleUsers: allUsers
        }
      });
    } catch (error: any) {
      console.error("Newsletter data preview error:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch newsletter data',
        error: error.message
      });
    }
  });

  // Send Sam Roth's specific feedback email for Private Soccer Class
  app.post("/api/test/send-sam-feedback", async (req, res) => {
    try {
      // Use exact data from database for Sam Roth's Private Soccer Class
      const customer = {
        id: 36,
        firstName: "Sam",
        lastName: "Roth",
        email: "samgroth@gmail.com",
        role: 'customer' as const,
        isApproved: true,
        createdAt: new Date('2025-06-18T22:11:12.427Z'),
        updatedAt: new Date('2025-06-18T22:11:12.427Z')
      };
      
      const classData = {
        id: 1841,
        title: "Private Soccer Class (Ages 4-8) with Ryan Z",
        description: "Individualized, outdoor soccer training that helps kids develop technical skills and most importantly HAVE FUN in a small group setting.",
        startTime: new Date('2025-09-18T00:00:00'),
        endTime: new Date('2025-09-18T01:00:00'),
        address: "295 Day Street, San Francisco, CA, 94131",
        whatToBring: "Water bottle, soccer cleats (optional), soccer ball (optional), desire to improve soccer skills",
        price: 30,
        coachId: 175,
        categoryId: 6,
        capacity: 10,
        image: "https://res.cloudinary.com/dbtslhlgp/image/upload/v1755121704/trainn/pnjqbes2itsbpfietkah.jpg",
        location: "Upper Noe Recreation Center",
        ageGroup: "Kids",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const coach = {
        id: 175,
        firstName: "Ryan",
        lastName: "Zoradi",
        email: "rzoradi+coach@gmail.com",
        role: 'coach' as const,
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const booking = {
        id: 267,
        userId: 36,
        classId: 1841,
        quantity: 1,
        status: "confirmed" as const,
        paymentDate: new Date('2025-09-12T18:43:07.682Z'),
        paymentMethod: "link" as const,
        amount: 3000, // $30.00 in cents
        currency: "usd",
        platformFee: 450, // 15% of $30
        coachPayout: 2550, // 85% of $30
        createdAt: new Date('2025-09-12T18:43:07.682Z'),
        stripePaymentId: null,
        stripeTransferId: null,
        payoutStatus: null,
        payoutDate: null,
        stripePaymentIntentId: "pi_3S6bvuDlfK76TOG01U3kOOfS"
      };

      const { sendPostClassFeedbackEmail } = await import('./email');
      const emailSent = await sendPostClassFeedbackEmail({
        booking,
        classData,
        customer,
        coach
      });

      if (emailSent) {
        res.json({ 
          success: true, 
          message: 'Post-class feedback email sent successfully to samgroth@gmail.com',
          details: {
            customerName: customer.firstName,
            className: classData.title,
            coachName: coach.firstName,
            to: customer.email,
            classDate: classData.startTime,
            bookingId: booking.id
          }
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send feedback email to Sam Roth' 
        });
      }
    } catch (error: any) {
      console.error("Sam feedback email error:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send feedback email to Sam Roth',
        error: error.message
      });
    }
  });

  // Test endpoint for subsidy calculation
  app.post("/api/test/subsidy-calculation", requireAuth, async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking ID is required"
        });
      }
      
      // Get platform subsidy for this booking
      const subsidyAmount = await storage.getPlatformSubsidyForBooking(bookingId);
      
      // Get booking details for context
      const booking = await storage.getBooking(bookingId);
      const classItem = booking ? await storage.getClass(booking.classId) : null;
      
      res.json({
        success: true,
        message: "Subsidy calculation test completed",
        data: {
          bookingId,
          subsidyAmount,
          subsidyDollars: (subsidyAmount / 100).toFixed(2),
          booking: booking ? {
            id: booking.id,
            classId: booking.classId,
            userId: booking.userId,
            status: booking.status
          } : null,
          class: classItem ? {
            id: classItem.id,
            title: classItem.title,
            price: classItem.price
          } : null
        }
      });
      
    } catch (error) {
      console.error("Subsidy calculation test error:", error);
      res.status(500).json({
        success: false,
        message: "Subsidy calculation test failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Process referrer rewards - manually trigger reward processing
  app.post("/api/admin/process-referrer-rewards", requireAdmin, async (req, res) => {
    try {
      console.log("=== MANUAL REFERRER REWARD PROCESSING ===");
      await storage.processReferrerRewards();
      
      res.json({
        success: true,
        message: "Referrer rewards processed successfully"
      });
    } catch (error) {
      console.error("Error processing referrer rewards:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process referrer rewards",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Check and award rewards for specific referrer
  app.post("/api/admin/check-referrer-rewards/:referrerId", requireAdmin, async (req, res) => {
    try {
      const referrerId = parseInt(req.params.referrerId);
      const rewardsAwarded = await storage.checkAndAwardReferrerRewards(referrerId);
      
      res.json({
        success: true,
        message: `Processed ${rewardsAwarded} referrer rewards`,
        rewardsAwarded
      });
    } catch (error) {
      console.error("Error checking referrer rewards:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check referrer rewards",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get payout statistics (admin only)
  app.get("/api/admin/payout-stats", requireAdmin, async (req, res) => {
    try {
      const { payoutProcessor } = await import('./payout-processor');
      const stats = await payoutProcessor.getPayoutStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error getting payout stats:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get scheduled payouts (admin only)
  app.get("/api/admin/scheduled-payouts", requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const payouts = await storage.getScheduledPayouts(
        status ? { status: status as string } : undefined
      );
      res.json(payouts);
    } catch (error: any) {
      console.error("Error getting scheduled payouts:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get coach's scheduled payouts (coaches can see their own)
  app.get("/api/coach/scheduled-payouts", requireCoach, async (req, res) => {
    try {
      const payouts = await storage.getScheduledPayoutsByCoach(req.user.id);
      res.json(payouts);
    } catch (error: any) {
      console.error("Error getting coach payouts:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Handle payment webhook from Stripe
  app.post("/api/payment/webhook", async (req, res) => {
    // If Stripe is not available, return success for testing
    if (!stripe) {
      return res.status(200).json({ received: true });
    }
    
    let event;
    
    try {
      // Get webhook event data
      const payload = req.body;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      // Verify webhook signature if secret is available
      if (endpointSecret) {
        const signature = req.headers['stripe-signature'] as string;
        
        try {
          event = stripe.webhooks.constructEvent(
            payload,
            signature,
            endpointSecret
          );
        } catch (err: any) {
          console.error(`Webhook signature verification failed: ${err.message}`);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        // Fallback if no webhook secret is configured
        event = req.body;
      }
      
      // Handle different webhook events
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          
          // Create confirmed booking directly (no pending status)
          if (paymentIntent.metadata && paymentIntent.metadata.classId && paymentIntent.metadata.userId) {
            // Check if booking already exists to avoid duplicates
            const existingBookings = await storage.getUserBookings(parseInt(paymentIntent.metadata.userId));
            const duplicate = existingBookings.find(b => 
              b.classId === parseInt(paymentIntent.metadata.classId) && 
              b.stripePaymentIntentId === paymentIntent.id
            );
            
            if (!duplicate) {
              const booking = await storage.createBooking({
                userId: parseInt(paymentIntent.metadata.userId),
                classId: parseInt(paymentIntent.metadata.classId),
                quantity: 1,
                status: "confirmed",
                stripePaymentIntentId: paymentIntent.id,
                paymentDate: new Date(),
                paymentMethod: "stripe"
              });

              // Update provider referral booking count for the coach
              try {
                const classDetails = await storage.getClass(parseInt(paymentIntent.metadata.classId));
                if (classDetails) {
                  await storage.updateProviderReferralBookingCount(classDetails.coachId);
                  console.log(`Updated provider referral booking count for coach ${classDetails.coachId} via webhook`);
                }
              } catch (providerReferralError) {
                console.error("Error updating provider referral booking count in webhook:", providerReferralError);
                // Don't fail the webhook if provider referral update fails
              }

              // Send admin notification for webhook-created booking
              try {
                const classDetails = await storage.getClass(parseInt(paymentIntent.metadata.classId));
                const customer = await storage.getUser(parseInt(paymentIntent.metadata.userId));
                
                if (classDetails && customer) {
                  const coach = await storage.getUser(classDetails.coachId);
                  
                  if (coach) {
                    await sendBookingAdminNotification({
                      booking,
                      classData: classDetails,
                      customer,
                      coach,
                      bookingType: 'paid',
                      paymentAmount: paymentIntent.amount
                    });
                  }
                }
              } catch (adminEmailError) {
                console.error("Admin notification error in webhook:", adminEmailError);
                // Don't fail the webhook if admin notification fails
              }
            }
          }
          break;
          
        case 'payment_intent.payment_failed':
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error(`Webhook error: ${error.message}`);
      res.status(500).send(`Webhook Error: ${error.message}`);
    }
  });
  
  // Password reset request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.status(200).json({ 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }
      
      // Generate secure token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Create reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt
      });
      
      // Send email (import sendEmail function)
      const { sendEmail } = await import('./email');
      const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${req.get('host')}/reset-password?token=${token}`;
      
      const emailSent = await sendEmail({
        to: user.email,
        subject: 'Reset Your Trainn Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hello ${user.firstName},</p>
            <p>You requested to reset your password for your Trainn account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The Trainn Team
            </p>
          </div>
        `,
        text: `
          Reset Your Password
          
          Hello ${user.firstName},
          
          You requested to reset your password for your Trainn account. 
          
          Click this link to reset your password: ${resetUrl}
          
          This link will expire in 1 hour.
          
          If you didn't request this password reset, please ignore this email.
          
          Best regards,
          The Trainn Team
        `
      });
      
      if (emailSent) {
        console.log(`Password reset email sent to ${email}`);
      } else {
        console.error(`Failed to send password reset email to ${email}`);
      }
      
      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
      
    } catch (error: any) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  
  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      // Get and validate token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash new password using existing function from auth.ts
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user password
      const updatedUser = await storage.updateUserPassword(resetToken.userId, hashedPassword);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);
      
      res.status(200).json({ message: "Password has been successfully reset. You can now sign in with your new password." });
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Update user profile
  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own profile
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this user" });
      }
      
      // Get allowed fields based on the request body
      const allowedFields = ['firstName', 'lastName', 'businessName', 'displayBusinessName', 'phone', 'bio', 'profileImage', 'areasOfExpertise', 'certifications'];
      const updateData: Record<string, any> = {};
      
      // Use explicit property assignment to avoid prototype pollution
      if ('firstName' in req.body) updateData.firstName = req.body.firstName;
      if ('lastName' in req.body) updateData.lastName = req.body.lastName;
      if ('businessName' in req.body) updateData.businessName = req.body.businessName;
      if ('displayBusinessName' in req.body) updateData.displayBusinessName = req.body.displayBusinessName;
      if ('phone' in req.body) updateData.phone = req.body.phone;
      if ('bio' in req.body) updateData.bio = req.body.bio;
      if ('profileImage' in req.body) updateData.profileImage = req.body.profileImage;
      if ('areasOfExpertise' in req.body) updateData.areasOfExpertise = req.body.areasOfExpertise;
      if ('certifications' in req.body) updateData.certifications = req.body.certifications;
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Update newsletter preference
  app.put("/api/users/:id/newsletter-preference", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own preference
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this preference" });
      }
      
      const { receiveNewsletter } = req.body;
      
      if (typeof receiveNewsletter !== 'boolean') {
        return res.status(400).json({ message: "Invalid newsletter preference value" });
      }
      
      // Update the user's newsletter preference
      const updatedUser = await storage.updateUser(userId, { receiveNewsletter });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating newsletter preference:", error);
      res.status(500).json({ message: "Failed to update newsletter preference" });
    }
  });

  // Update primary city preference
  app.put("/api/users/:id/primary-city", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own preference
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this preference" });
      }
      
      const { primaryCity } = req.body;
      
      // Validate the primary city value
      const validCities = ['san_francisco', 'los_angeles'];
      if (!validCities.includes(primaryCity)) {
        return res.status(400).json({ message: "Invalid primary city value" });
      }
      
      // Update the user's primary city preference
      const updatedUser = await storage.updateUser(userId, { primaryCity });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive information
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating primary city:", error);
      res.status(500).json({ message: "Failed to update primary city" });
    }
  });

  // Change password endpoint
  app.put("/api/users/:id/password", requireAuth, async (req, res) => {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;
    
    // Ensure user can only change their own password
    if (req.user?.id !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }
    
    try {
      // Get current user to verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password using same method as auth.ts
      const crypto = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(crypto.scrypt);
      
      // Split using dot separator (same as auth.ts)
      const [storedHash, salt] = user.password.split('.');
      const hashedBuf = Buffer.from(storedHash, 'hex');
      const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
      
      if (!crypto.timingSafeEqual(hashedBuf, suppliedBuf)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const { hashPassword } = await import('./auth');
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password in database
      const updatedUser = await storage.updateUserPassword(userId, hashedNewPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Create Stripe Connect onboarding link for coaches
  app.post("/api/coaches/:id/stripe-onboarding", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const coachId = parseInt(req.params.id);
      
      // Ensure the user is updating their own settings or is an admin
      if (coachId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You cannot modify another coach's payment settings" });
      }
      
      // Get the coach user
      const coach = await storage.getUser(coachId);
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      // Ensure coach role
      if (coach.role !== "coach") {
        return res.status(400).json({ message: "User is not a coach" });
      }

      let stripeConnectId = coach.stripeConnectId;

      // Create new Stripe Connect account if none exists
      if (!stripeConnectId) {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: coach.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: `${coach.firstName} ${coach.lastName}`,
            product_description: 'Fitness, sports and creative class coaching and training services',
          },
        });
        
        stripeConnectId = account.id;
        
        // Update coach record with Stripe Connect ID
        await storage.updateUser(coachId, {
          stripeConnectId
        });
      }

      // Create onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: stripeConnectId,
        refresh_url: `${req.get('origin')}/profile?tab=payment&refresh=true`,
        return_url: `${req.get('origin')}/profile?tab=payment&success=true`,
        type: 'account_onboarding',
      });

      res.json({ 
        onboardingUrl: accountLink.url,
        stripeConnectId 
      });
    } catch (error: any) {
      console.error("Stripe onboarding error:", error);
      res.status(500).json({ 
        message: "Error creating onboarding link", 
        error: error.message 
      });
    }
  });

  // Check Stripe Connect account status
  app.get("/api/coaches/:id/stripe-status", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const coachId = parseInt(req.params.id);
      
      // Ensure the user is checking their own status or is an admin
      if (coachId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You cannot view another coach's payment status" });
      }
      
      const coach = await storage.getUser(coachId);
      if (!coach || !coach.stripeConnectId) {
        return res.json({ 
          connected: false, 
          onboarded: false,
          canReceivePayments: false 
        });
      }

      // Get account details from Stripe
      const account = await stripe.accounts.retrieve(coach.stripeConnectId);
      
      const connected = !!account;
      const onboarded = account.details_submitted && account.charges_enabled;
      
      // Update database if onboarding status changed
      if (onboarded !== coach.stripeConnectOnboarded) {
        await storage.updateUser(coachId, {
          stripeConnectOnboarded: onboarded
        });
      }

      res.json({
        connected,
        onboarded,
        canReceivePayments: onboarded && account.payouts_enabled,
        accountId: coach.stripeConnectId
      });
    } catch (error: any) {
      console.error("Stripe status check error:", error);
      res.status(500).json({ 
        message: "Error checking Stripe status", 
        error: error.message 
      });
    }
  });

  // Save coach's payment settings and connect with Stripe
  app.post("/api/coaches/:id/payment-settings", requireAuth, async (req, res) => {
    try {
      // Ensure the user is updating their own settings or is an admin
      if (req.params.id !== req.user.id.toString() && req.user.role !== "admin") {
        return res.status(403).json({ message: "You cannot modify another coach's payment settings" });
      }
      
      // Get the coach user
      const coach = await storage.getUser(parseInt(req.params.id));
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      // Ensure coach role
      if (coach.role !== "coach") {
        return res.status(400).json({ message: "User is not a coach" });
      }
      
      const { accountType, accountHolderName, accountNumber, routingNumber, bankName } = req.body;
      
      // Validate required fields
      if (!accountType || !accountHolderName || !accountNumber || !routingNumber || !bankName) {
        return res.status(400).json({ message: "All banking fields are required" });
      }
      
      // If Stripe is available, create or update Connect account
      if (stripe) {
        try {
          let stripeConnectId = coach.stripeConnectId;
          
          // Create new Stripe Connect account if none exists
          if (!stripeConnectId) {
            const account = await stripe.accounts.create({
              type: 'express',
              country: 'US',
              email: coach.email,
              business_type: accountType,
              capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
              },
              business_profile: {
                name: `${coach.firstName} ${coach.lastName}`,
                url: `https://elevate-fitness.com/coaches/${coach.id}`, // Replace with actual URL
              },
            });
            
            stripeConnectId = account.id;
          }
          
          // Update bank account
          await stripe.accounts.createExternalAccount(
            stripeConnectId,
            {
              external_account: {
                object: 'bank_account',
                country: 'US',
                currency: 'usd',
                account_holder_name: accountHolderName,
                account_holder_type: accountType,
                routing_number: routingNumber,
                account_number: accountNumber,
              } as any,
            }
          );
          
          // Update coach record in database
          await storage.updateUser(parseInt(req.params.id), {
            stripeConnectId,
            bankAccountVerified: true
          });
          
          res.status(200).json({
            message: "Payment settings updated successfully",
            stripeConnectId,
            bankAccountVerified: true
          });
        } catch (stripeError: any) {
          console.error("Stripe error:", stripeError);
          res.status(400).json({ 
            message: "Error setting up payment account", 
            error: stripeError.message 
          });
        }
      } else {
        // If Stripe is not available, still mark account as verified for testing
        await storage.updateUser(parseInt(req.params.id), {
          bankAccountVerified: true
        });
        
        res.status(200).json({
          message: "Payment settings updated successfully (Stripe integration disabled)",
          bankAccountVerified: true
        });
      }
    } catch (error: any) {
      console.error("Payment settings error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Test endpoint for email confirmation (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/test-email/:classId", async (req, res) => {
      try {
        const { classId } = req.params;
        
        if (!classId) {
          return res.status(400).json({ message: "Class ID is required" });
        }
        
        // Get class details
        const classDetails = await storage.getClass(parseInt(classId));
        if (!classDetails) {
          return res.status(404).json({ message: "Class not found" });
        }
        
        // Get coach details
        const coach = await storage.getUser(classDetails.coachId);
        if (!coach) {
          return res.status(404).json({ message: "Coach not found" });
        }
        
        // Get a test customer (first customer in database)
        const users = await storage.getAllUsers();
        const testCustomer = users.find(u => u.role === 'customer');
        if (!testCustomer) {
          return res.status(404).json({ message: "No test customer found" });
        }
        
        // Create a mock booking for testing
        const mockBooking = {
          id: 999,
          userId: testCustomer.id,
          classId: parseInt(classId),
          quantity: 1,
          status: "confirmed" as const,
          stripePaymentIntentId: "test_pi_" + Date.now(),
          paymentDate: new Date(),
          paymentMethod: "stripe" as const,
          amount: classDetails.price * 100, // In cents
          currency: "usd",
          platformFee: Math.round(classDetails.price * 100 * 0.15),
          coachPayout: Math.round(classDetails.price * 100 * 0.85),
          createdAt: new Date(),
          stripePaymentId: null,
          stripeTransferId: null,
          payoutStatus: null,
          payoutDate: null
        };
        
        // Send test email
        const emailSent = await sendBookingConfirmation({
          booking: mockBooking,
          classData: classDetails,
          customer: testCustomer,
          coach: coach
        });
        
        if (emailSent) {
          res.json({ 
            success: true, 
            message: `Test confirmation email sent to ${testCustomer.email}`,
            mockBooking: mockBooking,
            emailDetails: {
              to: testCustomer.email,
              className: classDetails.title,
              classDate: classDetails.startTime,
              coach: `${coach.firstName} ${coach.lastName}`,
              cost: classDetails.price
            }
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: "Failed to send test email" 
          });
        }
      } catch (error: any) {
        console.error("Test email error:", error);
        res.status(500).json({ message: error.message });
      }
    });

    // Test endpoint for coach notification email (development only)
    app.get("/api/test-coach-email/:classId", async (req, res) => {
      try {
        const { classId } = req.params;
        
        if (!classId) {
          return res.status(400).json({ message: "Class ID is required" });
        }
        
        // Get class details
        const classDetails = await storage.getClass(parseInt(classId));
        if (!classDetails) {
          return res.status(404).json({ message: "Class not found" });
        }
        
        // Get coach details
        const coach = await storage.getUser(classDetails.coachId);
        if (!coach) {
          return res.status(404).json({ message: "Coach not found" });
        }
        
        // Get a test customer (first customer in database)
        const users = await storage.getAllUsers();
        const testCustomer = users.find(u => u.role === 'customer');
        if (!testCustomer) {
          return res.status(404).json({ message: "No test customer found" });
        }
        
        // Create a mock booking for testing
        const mockBooking = {
          id: 999,
          userId: testCustomer.id,
          classId: parseInt(classId),
          quantity: 1,
          status: "confirmed" as const,
          stripePaymentIntentId: "test_pi_" + Date.now(),
          paymentDate: new Date(),
          paymentMethod: "stripe" as const,
          amount: classDetails.price * 100,
          currency: "usd",
          platformFee: Math.round(classDetails.price * 100 * 0.15),
          coachPayout: Math.round(classDetails.price * 100 * 0.85),
          createdAt: new Date(),
          stripePaymentId: null,
          stripeTransferId: null,
          payoutStatus: null,
          payoutDate: null
        };
        
        // Send test coach notification email
        const { sendNewBookingNotificationToCoach } = await import('./email');
        const emailSent = await sendNewBookingNotificationToCoach(coach, testCustomer, classDetails, mockBooking);
        
        if (emailSent) {
          res.json({ 
            success: true, 
            message: `Test coach notification sent to ${coach.email}`,
            mockBooking: mockBooking,
            emailDetails: {
              to: coach.email,
              className: classDetails.title,
              classDate: classDetails.startTime,
              customer: `${testCustomer.firstName} ${testCustomer.lastName}`,
              spots: mockBooking.quantity
            }
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: "Failed to send test coach email" 
          });
        }
      } catch (error: any) {
        console.error("Test coach email error:", error);
        res.status(500).json({ message: error.message });
      }
    });
  }

  // Get customers for coach/admin
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      // Only allow coaches and admins to access customer data
      if (userRole !== 'coach' && userRole !== 'admin') {
        return res.status(403).json({ message: "Coach or admin access required" });
      }
      
      // Get customer bookings based on role
      const customers = await storage.getCustomersForCoach(userId, userRole);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Contact message routes
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Create contact message in database
      const contactMessage = await storage.createContactMessage({
        name,
        email,
        subject,
        message
      });
      
      // Send email notification to support
      const { sendEmail } = await import('./email');
      const emailSent = await sendEmail({
        to: "support@trainn.pro",
        subject: `Contact Form: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
        html: `
          <h3>New Contact Form Message</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      });
      
      if (!emailSent) {
        console.error("Failed to send contact email notification");
      }
      
      res.status(201).json({ 
        message: "Your message has been sent successfully. We'll get back to you soon!",
        id: contactMessage.id 
      });
    } catch (error: any) {
      console.error("Contact message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Get all contact messages (admin only)
  app.get("/api/contact", requireAuth, requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Review endpoints
  
  // Create a new review
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const { classId, bookingId, rating, comment } = req.body;
      
      // Validate required fields
      if (!classId || !bookingId || !rating) {
        return res.status(400).json({ message: "Class ID, booking ID, and rating are required" });
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      // Verify the booking belongs to the user and class has occurred
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only review your own bookings" });
      }
      
      if (booking.classId !== classId) {
        return res.status(400).json({ message: "Booking does not match the specified class" });
      }
      
      // Check if class has occurred
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (new Date(classItem.startTime!) > new Date()) {
        return res.status(400).json({ message: "Cannot review a class that hasn't occurred yet" });
      }
      
      // Check if review already exists for this specific booking
      const existingReview = await storage.getReviewByClassAndBooking(classId, bookingId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this booking" });
      }
      
      // Create the review
      const review = await storage.createReview({
        userId: req.user!.id,
        classId,
        bookingId,
        coachId: classItem.coachId,
        rating,
        comment: comment || null
      });
      
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  
  // Update an existing review
  app.put("/api/reviews/:reviewId", requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      const { rating, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Valid rating (1-5) is required" });
      }
      
      // Get existing review to verify ownership
      const existingReviews = await storage.getUserReviews(req.user!.id);
      const existingReview = existingReviews.find(review => review.id === reviewId);
      
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found or not owned by you" });
      }
      
      // Update review (this would need to be implemented in storage)
      // For now, we'll create a simple update method
      const updatedReview = await storage.updateReview(reviewId, {
        rating,
        comment: comment || null
      });
      
      res.json(updatedReview);
    } catch (error: any) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });
  
  // Get reviews for a specific class
  app.get("/api/reviews/class/:classId", async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const reviews = await storage.getClassReviews(classId);
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching class reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  // Get reviews for a specific coach
  app.get("/api/reviews/coach/:coachId", async (req, res) => {
    try {
      const coachId = parseInt(req.params.coachId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      // Get all reviews for this coach directly using coach_id
      let coachReviews = await storage.getCoachReviews(coachId);
      
      // Apply limit if specified
      if (limit && limit > 0) {
        coachReviews = coachReviews.slice(0, limit);
      }
      
      // Calculate average rating
      const averageRating = coachReviews.length > 0 
        ? coachReviews.reduce((sum, review) => sum + review.rating, 0) / coachReviews.length 
        : 0;
      
      res.json({
        reviews: coachReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: coachReviews.length
      });
    } catch (error: any) {
      console.error("Error fetching coach reviews:", error);
      res.status(500).json({ message: "Failed to fetch coach reviews" });
    }
  });
  
  // Get reviews by a specific customer
  app.get("/api/reviews/customer/:customerId", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      
      // Only allow users to view their own reviews or admin
      if (req.user!.id !== customerId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const reviews = await storage.getUserReviews(customerId);
      res.json(reviews);
    } catch (error: any) {
      console.error("Error fetching customer reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get specific review by class and booking ID
  app.get("/api/reviews/class/:classId/:bookingId", requireAuth, async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const bookingId = parseInt(req.params.bookingId);
      const review = await storage.getReviewByClassAndBooking(classId, bookingId);
      if (review) {
        res.json(review);
      } else {
        res.status(404).json({ error: "Review not found" });
      }
    } catch (error: any) {
      console.error("Error fetching specific review:", error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });

  // Blog post routes
  
  // Get all published blog posts (public)
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts({ status: "published" });
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get all blog posts including drafts (admin only)
  app.get("/api/blog/admin", requireAuth, requireAdmin, async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching all blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get single blog post by ID (admin only)
  app.get("/api/blog/:id(\\d+)", requireAuth, requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getBlogPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      res.json(post);
    } catch (error: any) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Get single blog post by slug (public for published, admin for all)
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Check if post is published or user is admin
      if (post.status !== "published") {
        // Only allow admin to view unpublished posts
        if (!req.user || req.user.role !== "admin") {
          return res.status(404).json({ message: "Blog post not found" });
        }
      }

      res.json(post);
    } catch (error: any) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Create new blog post (admin only)
  app.post("/api/blog", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, content, excerpt, slug, featuredImage, status, tags, metaDescription } = req.body;

      if (!title || !content || !slug) {
        return res.status(400).json({ message: "Title, content, and slug are required" });
      }

      // Calculate read time (approximate: 200 words per minute)
      const wordCount = content.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);

      const blogPost = await storage.createBlogPost({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + "...",
        slug,
        featuredImage: featuredImage || null,
        authorId: req.user!.id,
        status: status || "draft",
        publishedAt: status === "published" ? new Date() : null,
        tags: tags || [],
        metaDescription: metaDescription || null,
        readTime
      });

      res.status(201).json(blogPost);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      if (error.message?.includes("duplicate key")) {
        return res.status(400).json({ message: "A blog post with this slug already exists" });
      }
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  // Update blog post (admin only)
  app.put("/api/blog/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { title, content, excerpt, slug, featuredImage, status, tags, metaDescription } = req.body;

      const existingPost = await storage.getBlogPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Calculate read time if content changed
      const wordCount = content ? content.split(/\s+/).length : 0;
      const readTime = content ? Math.ceil(wordCount / 200) : existingPost.readTime;

      const updatedPost = await storage.updateBlogPost(postId, {
        title: title || existingPost.title,
        content: content || existingPost.content,
        excerpt: excerpt || existingPost.excerpt,
        slug: slug || existingPost.slug,
        featuredImage: featuredImage !== undefined ? featuredImage : existingPost.featuredImage,
        status: status || existingPost.status,
        publishedAt: status === "published" && existingPost.status !== "published" ? new Date() : existingPost.publishedAt,
        tags: tags || existingPost.tags,
        metaDescription: metaDescription !== undefined ? metaDescription : existingPost.metaDescription,
        readTime
      });

      res.json(updatedPost);
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  // Delete blog post (admin only)
  app.delete("/api/blog/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      const existingPost = await storage.getBlogPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      await storage.deleteBlogPost(postId);
      res.json({ message: "Blog post deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // ========== PROMO CODE ROUTES ==========
  
  // Get all promo codes (admin only)
  app.get("/api/promo-codes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { coachId, isActive, requiresApproval, isApproved } = req.query;
      
      const filters: any = {};
      if (coachId) filters.coachId = parseInt(coachId as string);
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (requiresApproval !== undefined) filters.requiresApproval = requiresApproval === 'true';
      if (isApproved !== undefined) filters.isApproved = isApproved === 'true';
      
      const promoCodes = await storage.getPromoCodes(filters);
      res.json(promoCodes);
    } catch (error: any) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ message: "Failed to fetch promo codes" });
    }
  });

  // Get promo codes for current coach
  app.get("/api/promo-codes/my", requireAuth, requireCoach, async (req, res) => {
    try {
      const promoCodes = await storage.getPromoCodes({ 
        coachId: req.user!.id 
      });
      res.json(promoCodes);
    } catch (error: any) {
      console.error("Error fetching coach promo codes:", error);
      res.status(500).json({ message: "Failed to fetch promo codes" });
    }
  });

  // Create promo code (coaches with approval, admins direct)
  app.post("/api/promo-codes", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      if (user.role !== 'coach' && user.role !== 'admin') {
        return res.status(403).json({ message: "Only coaches and admins can create promo codes" });
      }

      const {
        code,
        name,
        description,
        discountType,
        discountValue,
        coachId,
        firstBookingOnly,
        minimumQuantity,
        usageLimit,
        validFrom,
        validUntil,
        platformSubsidized,
        commissionOverride,
        budgetLimit
      } = req.body;

      // Validation
      if (!code || !name || !discountType || !discountValue || !validFrom || !validUntil) {
        return res.status(400).json({ 
          message: "Code, name, discount type, discount value, valid from, and valid until are required" 
        });
      }

      if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({ message: "Discount type must be 'percentage' or 'fixed'" });
      }

      if (discountValue <= 0) {
        return res.status(400).json({ message: "Discount value must be positive" });
      }

      if (discountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({ message: "Percentage discount cannot exceed 100%" });
      }

      // Check if code already exists
      const existingCode = await storage.getPromoCodeByCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Promo code already exists" });
      }

      // Set approval settings based on user role
      const requiresApproval = user.role === 'coach';
      const isApproved = user.role === 'admin';
      const finalCoachId = coachId || (user.role === 'coach' ? user.id : null);

      // Convert discount value: for fixed amounts, convert dollars to cents
      const processedDiscountValue = discountType === 'fixed' 
        ? Math.round(discountValue * 100) 
        : discountValue;

      const promoCodeData = {
        code: code.toUpperCase(),
        name,
        description: description || null,
        discountType,
        discountValue: processedDiscountValue,
        coachId: finalCoachId,
        isActive: true,
        requiresApproval,
        isApproved,
        approvedBy: isApproved ? user.id : null,
        approvedAt: isApproved ? new Date() : null,
        firstBookingOnly: firstBookingOnly || false,
        minimumQuantity: minimumQuantity || 1,
        usageLimit: usageLimit || null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        platformSubsidized: platformSubsidized || false,
        commissionOverride: commissionOverride || null,
        budgetLimit: budgetLimit || null,
        createdBy: user.id
      };

      const promoCode = await storage.createPromoCode(promoCodeData);
      
      // Send email notification to admin if coach created a code requiring approval
      if (user.role === 'coach' && requiresApproval) {
        try {
          await sendPromoCodeApprovalRequest(user, promoCode, false);
        } catch (emailError) {
          console.error('Failed to send promo code approval email:', emailError);
          // Don't fail the creation if email fails
        }
      }
      
      res.status(201).json(promoCode);
    } catch (error: any) {
      console.error("Error creating promo code:", error);
      res.status(500).json({ message: "Failed to create promo code" });
    }
  });

  // Update promo code (admin only or coach for their own pending codes)
  app.put("/api/promo-codes/:id", requireAuth, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      const user = req.user!;

      const existingPromoCode = await storage.getPromoCode(promoCodeId);
      if (!existingPromoCode) {
        return res.status(404).json({ message: "Promo code not found" });
      }

      // Debug logging
      console.log(`PUT promo code - User ID: ${user.id}, Role: ${user.role}`);
      console.log(`Existing promo code - ID: ${existingPromoCode.id}, CoachId: ${existingPromoCode.coachId}, CreatedBy: ${existingPromoCode.createdBy}`);
      
      // Check permissions - allow admins or coaches editing their own codes
      const isAdmin = user.role === 'admin';
      const isOwner = existingPromoCode.coachId === user.id || existingPromoCode.createdBy === user.id;
      
      if (!isAdmin && (!isOwner || user.role !== 'coach')) {
        console.log(`Access denied - isAdmin: ${isAdmin}, isOwner: ${isOwner}, userRole: ${user.role}`);
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log(`Access granted - proceeding with update`);

      const updateData: any = {};
      const allowedFields = ['name', 'description', 'discountType', 'discountValue', 
                           'firstBookingOnly', 'minimumQuantity', 'usageLimit', 'validFrom', 'validUntil',
                           'platformSubsidized', 'commissionOverride', 'budgetLimit', 'isActive'];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // If a coach is editing an approved code, reset approval status for re-approval
      if (user.role === 'coach' && existingPromoCode.isApproved) {
        updateData.isApproved = false;
        updateData.approvedBy = null;
        updateData.approvedAt = null;
        updateData.requiresApproval = true;
      }

      // Convert discount value: for fixed amounts, convert dollars to cents
      if (updateData.discountValue !== undefined && updateData.discountType === 'fixed') {
        updateData.discountValue = Math.round(updateData.discountValue * 100);
      } else if (updateData.discountValue !== undefined && existingPromoCode.discountType === 'fixed' && updateData.discountType !== 'percentage') {
        // If no discountType change but existing is fixed, convert to cents
        updateData.discountValue = Math.round(updateData.discountValue * 100);
      }

      // Convert date strings to Date objects
      if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
      if (updateData.validUntil) updateData.validUntil = new Date(updateData.validUntil);

      const updatedPromoCode = await storage.updatePromoCode(promoCodeId, updateData);
      
      // Send email notification to admin if coach edited a code that now requires approval
      if (user.role === 'coach' && (updateData.isApproved === false || !existingPromoCode.isApproved)) {
        try {
          await sendPromoCodeApprovalRequest(user, updatedPromoCode, true);
        } catch (emailError) {
          console.error('Failed to send promo code approval email:', emailError);
          // Don't fail the update if email fails
        }
      }
      
      res.json(updatedPromoCode);
    } catch (error: any) {
      console.error("Error updating promo code:", error);
      res.status(500).json({ message: "Failed to update promo code" });
    }
  });

  // Approve promo code (admin only)
  app.post("/api/promo-codes/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      const approvedPromoCode = await storage.approvePromoCode(promoCodeId, req.user!.id);
      
      if (!approvedPromoCode) {
        return res.status(404).json({ message: "Promo code not found" });
      }

      // Get the coach who created the promo code
      const coach = await storage.getUser(approvedPromoCode.createdBy);
      if (coach) {
        // Send approval email to coach
        await sendPromoCodeApprovalEmail(coach, approvedPromoCode);
      }

      res.json(approvedPromoCode);
    } catch (error: any) {
      console.error("Error approving promo code:", error);
      res.status(500).json({ message: "Failed to approve promo code" });
    }
  });

  app.post("/api/promo-codes/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      const rejectedPromoCode = await storage.rejectPromoCode(promoCodeId, req.user!.id);
      
      if (!rejectedPromoCode) {
        return res.status(404).json({ message: "Promo code not found" });
      }

      // Get the coach who created the promo code
      const coach = await storage.getUser(rejectedPromoCode.createdBy);
      if (coach) {
        // Send rejection email to coach
        await sendPromoCodeRejectionEmail(coach, rejectedPromoCode);
      }

      res.json(rejectedPromoCode);
    } catch (error: any) {
      console.error("Error rejecting promo code:", error);
      res.status(500).json({ message: "Failed to reject promo code" });
    }
  });

  // Delete promo code (admin can delete any, coaches can delete their own unused codes)
  app.delete("/api/promo-codes/:id", requireAuth, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      const user = req.user!;
      
      // Get the promo code to check ownership and usage
      const promoCode = await storage.getPromoCodeById(promoCodeId);
      if (!promoCode) {
        return res.status(404).json({ message: "Promo code not found" });
      }
      
      // Check permissions
      const isAdmin = user.role === 'admin';
      const isOwner = promoCode.coachId === user.id || promoCode.createdBy === user.id;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "You can only delete your own promo codes" });
      }
      
      // For coaches (non-admins), add restrictions
      if (!isAdmin) {
        if (promoCode.usageCount > 0) {
          return res.status(400).json({ 
            message: "Cannot delete promo code that has already been used by customers" 
          });
        }
        
        if (promoCode.isApproved && promoCode.isActive) {
          return res.status(400).json({ 
            message: "Cannot delete active approved promo codes. Please contact admin for assistance." 
          });
        }
      }
      
      const deleted = await storage.deletePromoCode(promoCodeId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete promo code" });
      }

      res.json({ message: "Promo code deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting promo code:", error);
      res.status(500).json({ message: "Failed to delete promo code" });
    }
  });

  // Validate promo code for booking
  app.post("/api/promo-codes/validate", requireAuth, async (req, res) => {
    try {
      const { code, classId, quantity = 1 } = req.body;
      
      if (!code || !classId) {
        return res.status(400).json({ message: "Code and class ID are required" });
      }

      const validation = await storage.validatePromoCode(code, req.user!.id, classId, quantity);
      
      if (!validation.valid) {
        console.log(`Promo code validation failed for ${code}: ${validation.error}`);
        return res.status(400).json({ 
          valid: false, 
          error: validation.error 
        });
      }

      // Get class to calculate discount
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Calculate discount based on total price (class price * quantity)
      const totalPrice = classItem.price * quantity * 100; // Convert to cents
      const discountCalc = await storage.calculateDiscount(validation.promoCode!, totalPrice);
      
      res.json({
        valid: true,
        promoCode: validation.promoCode,
        discountAmount: discountCalc.discountAmount,
        finalAmount: discountCalc.finalAmount,
        subsidyAmount: discountCalc.subsidyAmount
      });
    } catch (error: any) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  // Validate promo code for package booking
  app.post("/api/promo-codes/validate-package", requireAuth, async (req, res) => {
    try {
      const { code, packageId, quantity = 1 } = req.body;
      
      if (!code || !packageId) {
        return res.status(400).json({ message: "Code and package ID are required" });
      }

      const validation = await storage.validatePromoCodeForPackage(code, req.user!.id, packageId, quantity);
      
      if (!validation.valid) {
        console.log(`Promo code validation failed for ${code}: ${validation.error}`);
        return res.status(400).json({ 
          valid: false, 
          error: validation.error 
        });
      }

      // Get package to calculate discount
      const packageItem = await storage.getPackage(packageId);
      if (!packageItem) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Calculate discount based on total price (package price * quantity)
      const totalPrice = packageItem.price * quantity * 100; // Convert to cents
      const discountCalc = await storage.calculateDiscount(validation.promoCode!, totalPrice);
      
      res.json({
        valid: true,
        promoCode: validation.promoCode,
        discountAmount: discountCalc.discountAmount,
        finalAmount: discountCalc.finalAmount,
        subsidyAmount: discountCalc.subsidyAmount
      });
    } catch (error: any) {
      console.error("Error validating promo code for package:", error);
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  // Get promo code analytics (admin only)
  app.get("/api/promo-codes/:id/analytics", requireAuth, requireAdmin, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      const analytics = await storage.getPromoCodeAnalytics(promoCodeId);
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching promo code analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get booking subsidies (admin only)
  app.get("/api/booking-subsidies", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { promoCodeId, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (promoCodeId) filters.promoCodeId = parseInt(promoCodeId as string);
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const subsidies = await storage.getBookingSubsidies(filters);
      res.json(subsidies);
    } catch (error: any) {
      console.error("Error fetching booking subsidies:", error);
      res.status(500).json({ message: "Failed to fetch booking subsidies" });
    }
  });

  // User commission tiers management (admin only)
  app.get("/api/commission-tiers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const tiers = await storage.getUserCommissionTiers();
      res.json(tiers);
    } catch (error: any) {
      console.error("Error fetching commission tiers:", error);
      res.status(500).json({ message: "Failed to fetch commission tiers" });
    }
  });

  app.post("/api/commission-tiers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const {
        userId,
        tierName,
        commissionRate,
        validFrom,
        validUntil,
        notes
      } = req.body;

      if (!userId || !tierName || commissionRate === undefined || !validFrom) {
        return res.status(400).json({ 
          message: "User ID, tier name, commission rate, and valid from date are required" 
        });
      }

      if (commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({ message: "Commission rate must be between 0 and 100" });
      }

      const tierData = {
        userId,
        tierName,
        commissionRate,
        isActive: true,
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : null,
        assignedBy: req.user!.id,
        notes: notes || null
      };

      const tier = await storage.createUserCommissionTier(tierData);
      res.status(201).json(tier);
    } catch (error: any) {
      console.error("Error creating commission tier:", error);
      res.status(500).json({ message: "Failed to create commission tier" });
    }
  });

  app.put("/api/commission-tiers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const tierId = parseInt(req.params.id);
      const updateData: any = {};
      
      const allowedFields = ['tierName', 'commissionRate', 'isActive', 'validFrom', 'validUntil', 'notes'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      // Convert date strings to Date objects
      if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
      if (updateData.validUntil) updateData.validUntil = new Date(updateData.validUntil);

      const updatedTier = await storage.updateUserCommissionTier(tierId, updateData);
      
      if (!updatedTier) {
        return res.status(404).json({ message: "Commission tier not found" });
      }

      res.json(updatedTier);
    } catch (error: any) {
      console.error("Error updating commission tier:", error);
      res.status(500).json({ message: "Failed to update commission tier" });
    }
  });

  app.delete("/api/commission-tiers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const tierId = parseInt(req.params.id);
      const deleted = await storage.deleteUserCommissionTier(tierId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Commission tier not found" });
      }

      res.json({ message: "Commission tier deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting commission tier:", error);
      res.status(500).json({ message: "Failed to delete commission tier" });
    }
  });

  // Robots.txt route
  app.get("/robots.txt", (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /

Sitemap: https://trainn.pro/sitemap.xml`);
  });

  // Sitemap route
  app.get("/sitemap.xml", async (req, res) => {
    try {
      // Set the response type to XML
      res.setHeader('Content-Type', 'application/xml');
      
      // Static pages
      const staticPages = [
        '',
        '/about',
        '/classes',
        '/coaches',
        '/faq',
        '/contact',
        '/auth',
        '/register',
        '/terms',
        '/privacy',
        '/cookies',
        '/terms/dmca',
        '/about/communityguidelines',
        '/terms/gifts',
        '/terms/customer-referrals',
        '/outdoor-workouts-san-francisco',
        '/kids-drop-in-sports',
        '/kids-drop-in-sports-classes-san-francisco',
        '/kids-after-school-activities-san-francisco',
        '/kids-soccer-classes-san-francisco',
        '/outdoor-yoga-san-francisco',
        '/kids-drop-in-activities',
        '/easy-to-book-personal-trainers'
      ];
      
      // Get all active classes
      const allClasses = await storage.getClasses();
      
      // Get all approved coaches
      const allCoaches = await storage.getCoaches();
      const approvedCoaches = allCoaches.filter(coach => coach.isApproved);
      
      // Build sitemap XML
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      // Add static pages
      for (const page of staticPages) {
        sitemap += `
  <url>
    <loc>https://trainn.pro${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
      }
      
      // Add class pages
      for (const classItem of allClasses) {
        sitemap += `
  <url>
    <loc>https://trainn.pro/classes/${classItem.id}</loc>
    <lastmod>${new Date(classItem.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
      
      // Add coach pages
      for (const coach of approvedCoaches) {
        sitemap += `
  <url>
    <loc>https://trainn.pro/coaches/${coach.id}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
      
      sitemap += `
</urlset>`;

      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Referral system routes
  app.get("/api/referrals/my-code", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Ensure user has a referral code
      if (!user.referralCode) {
        const referralCode = storage.generateReferralCode(user.firstName, user.lastName, user.id);
        await storage.updateUser(user.id, { referralCode });
        user.referralCode = referralCode;
      }
      
      res.json({ referralCode: user.referralCode });
    } catch (error: any) {
      console.error('Error getting referral code:', error);
      res.status(500).json({ message: "Error getting referral code: " + error.message });
    }
  });

  // Get or create user's provider referral code
  app.get("/api/provider-referrals/my-code", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Ensure user has a provider referral code
      if (!user.providerReferralCode) {
        const providerReferralCode = storage.generateProviderReferralCode(user.firstName, user.lastName, user.id);
        await storage.updateUser(user.id, { providerReferralCode });
        user.providerReferralCode = providerReferralCode;
      }
      
      res.json({ providerReferralCode: user.providerReferralCode });
    } catch (error: any) {
      console.error('Error getting provider referral code:', error);
      res.status(500).json({ message: "Error getting provider referral code: " + error.message });
    }
  });

  app.get("/api/referrals/my-referrals", requireAuth, async (req, res) => {
    try {
      // Get both friend referrals and provider referrals
      const friendReferrals = await storage.getReferralsByReferrer(req.user!.id);
      const providerReferrals = await storage.getProviderReferralsByReferrer(req.user!.id);
      
      // Combine and format both types of referrals
      const combinedReferrals = [
        ...friendReferrals.map(r => ({ ...r, type: 'friend' })),
        ...providerReferrals.map(r => ({ ...r, type: 'provider' }))
      ];
      
      res.json(combinedReferrals);
    } catch (error: any) {
      console.error('Error getting referrals:', error);
      res.status(500).json({ message: "Error getting referrals: " + error.message });
    }
  });

  app.get("/api/referrals/my-status", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Check if this user was referred by someone else (they are a referee)
      const referralStatus = await storage.getReferralStatusForUser(userId);
      
      if (referralStatus) {
        res.json({
          isReferral: true,
          status: referralStatus.status,
          referrerName: referralStatus.referrerName,
          completedAt: referralStatus.completedAt
        });
      } else {
        res.json({
          isReferral: false,
          status: null
        });
      }
    } catch (error: any) {
      console.error('Error getting referral status:', error);
      res.status(500).json({ message: "Error getting referral status: " + error.message });
    }
  });

  app.get("/api/credits/balance", requireAuth, async (req, res) => {
    try {
      const balance = await storage.getUserCreditBalance(req.user!.id);
      res.json({ balance });
    } catch (error: any) {
      console.error('Error getting credit balance:', error);
      res.status(500).json({ message: "Error getting credit balance: " + error.message });
    }
  });

  app.get("/api/credits/history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getUserCreditHistory(req.user!.id);
      res.json(history);
    } catch (error: any) {
      console.error('Error getting credit history:', error);
      res.status(500).json({ message: "Error getting credit history: " + error.message });
    }
  });

  // Process referral signup (called during user registration)
  app.post("/api/referrals/process-signup", async (req, res) => {
    try {
      const { referralCode, userId } = req.body;
      
      if (!referralCode || !userId) {
        return res.status(400).json({ message: "Referral code and user ID are required" });
      }
      
      const referral = await storage.processReferralSignup(referralCode, userId);
      
      if (!referral) {
        return res.status(400).json({ message: "Invalid or expired referral code" });
      }
      
      // Grant the referee $10 credit immediately
      await storage.addUserCredit({
        userId,
        amount: 1000, // $10 in cents
        transactionType: 'referral_reward',
        description: 'Welcome credit - $10 off your first class',
        referralId: referral.id
      });
      
      res.json({ success: true, referral });
    } catch (error: any) {
      console.error('Error processing referral signup:', error);
      res.status(500).json({ message: "Error processing referral: " + error.message });
    }
  });

  // Provider Referral Routes
  
  // Create a new provider referral with auto-generated code
  app.post("/api/provider-referrals", requireAuth, async (req, res) => {
    try {
      // Generate a unique provider referral code
      const referralCode = `PROV-${req.user.firstName.toUpperCase()}${req.user.lastName.toUpperCase()}-${Date.now().toString(36)}`;
      
      const providerReferral = await storage.createProviderReferral({
        referrerId: req.user.id,
        referralCode,
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });
      
      res.status(201).json(providerReferral);
    } catch (error: any) {
      console.error("Error creating provider referral:", error);
      res.status(500).json({ message: "Failed to create provider referral" });
    }
  });

  // Get provider referrals for current user
  app.get("/api/provider-referrals", requireAuth, async (req, res) => {
    try {
      const providerReferrals = await storage.getProviderReferralsByReferrer(req.user.id);
      res.json(providerReferrals);
    } catch (error: any) {
      console.error("Error fetching provider referrals:", error);
      res.status(500).json({ message: "Failed to fetch provider referrals" });
    }
  });

  // Process provider referral signup
  app.post("/api/provider-referrals/signup", requireAuth, async (req, res) => {
    try {
      const { referralCode, providerId } = req.body;
      
      if (!referralCode || !providerId) {
        return res.status(400).json({ message: "Referral code and provider ID are required" });
      }
      
      const providerReferral = await storage.processProviderReferralSignup(referralCode, providerId);
      
      if (!providerReferral) {
        return res.status(400).json({ message: "Invalid or expired provider referral code" });
      }
      
      res.json({ success: true, providerReferral });
    } catch (error: any) {
      console.error("Error processing provider referral signup:", error);
      res.status(500).json({ message: "Failed to process provider referral signup" });
    }
  });

  // Try a different route prefix to avoid Vite conflicts
  app.get("/seo-pages/test", (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send('<html><body><h1>SEO Test Working!</h1></body></html>');
  });

  // SEO Landing Pages with different prefix
  app.get("/seo-pages/outdoor-workouts-san-francisco", async (req, res) => {
    try {
      const classes = await storage.getOutdoorWorkoutClassesSF();
      
      const pageTitle = "Outdoor Workouts in San Francisco | Book Fitness Classes at Parks & Beaches";
      const pageDescription = "Find outdoor fitness classes in San Francisco's best parks and beaches. Book strength training, yoga, cardio, HIIT, and personal training sessions with certified coaches. Drop-in classes available.";
      const keywords = "outdoor workout san francisco, fitness classes parks, beach workouts sf, dolores park fitness, golden gate park exercise, outdoor personal training, outdoor yoga san francisco";
      
      // Generate structured data for local business
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Outdoor Fitness Classes in San Francisco",
        "provider": {
          "@type": "Organization",
          "name": "Trainn",
          "url": "https://trainn.pro"
        },
        "areaServed": {
          "@type": "City",
          "name": "San Francisco",
          "addressRegion": "CA"
        },
        "serviceType": "Fitness Training",
        "description": pageDescription,
        "offers": classes.slice(0, 5).map(cls => ({
          "@type": "Offer",
          "name": cls.title,
          "description": cls.description,
          "price": cls.price,
          "priceCurrency": "USD",
          "url": `https://trainn.pro/classes/${cls.id}`,
          "availability": "InStock"
        }))
      };

      // Generate FAQ structured data
      const faqData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What types of outdoor workouts are available in San Francisco?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We offer outdoor yoga, strength training, HIIT, cardio, and personal training sessions at San Francisco's parks and beaches including Dolores Park, Golden Gate Park, Marina Green, and Baker Beach."
            }
          },
          {
            "@type": "Question",
            "name": "Do outdoor classes run in bad weather?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Most outdoor classes continue in light rain, but may be cancelled in heavy rain or dangerous weather. Check with your instructor for weather policies."
            }
          },
          {
            "@type": "Question",
            "name": "How much do outdoor fitness classes cost in San Francisco?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Outdoor fitness classes range from $25-$60 per session depending on the instructor and class type. Personal training sessions typically cost $60-$100."
            }
          }
        ]
      };

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow">
  
  <!-- Open Graph Tags -->
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDescription}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://trainn.pro/outdoor-workouts-san-francisco">
  <meta property="og:image" content="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=630&fit=crop">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://trainn.pro/outdoor-workouts-san-francisco">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  <script type="application/ld+json">${JSON.stringify(faqData)}</script>
  
  <!-- Styles -->
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; text-align: center; }
    .header h1 { font-size: 2.5rem; margin: 0; font-weight: 700; }
    .header p { font-size: 1.2rem; margin: 20px 0; opacity: 0.9; }
    .cta-button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .section { margin: 60px 0; }
    .section h2 { font-size: 2rem; margin-bottom: 30px; color: #333; }
    .classes-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; margin: 40px 0; }
    .class-card { border: 1px solid #e1e5e9; border-radius: 12px; overflow: hidden; transition: transform 0.2s; }
    .class-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .class-image { width: 100%; height: 200px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 600; }
    .class-content { padding: 20px; }
    .class-title { font-size: 1.3rem; font-weight: 600; margin: 0 0 10px 0; }
    .class-coach { color: #666; margin: 5px 0; }
    .class-location { color: #666; margin: 5px 0; }
    .class-price { font-size: 1.2rem; font-weight: 600; color: #667eea; margin: 10px 0; }
    .class-description { color: #666; margin: 10px 0; }
    .benefits { background: #f8f9fa; padding: 40px 20px; margin: 40px 0; border-radius: 12px; }
    .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-top: 30px; }
    .benefit { text-align: center; }
    .benefit-icon { font-size: 3rem; margin-bottom: 15px; }
    .locations { margin: 40px 0; }
    .locations ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .locations li { background: #f8f9fa; padding: 15px; border-radius: 8px; list-style: none; }
    .faq { margin: 40px 0; }
    .faq-item { margin: 20px 0; border: 1px solid #e1e5e9; border-radius: 8px; }
    .faq-question { background: #f8f9fa; padding: 20px; font-weight: 600; cursor: pointer; }
    .faq-answer { padding: 20px; border-top: 1px solid #e1e5e9; }
    .nav { background: white; padding: 15px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .nav a { color: #667eea; text-decoration: none; font-weight: 600; }
    @media (max-width: 768px) { .header h1 { font-size: 2rem; } .classes-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <nav class="nav">
    <a href="https://trainn.pro">← Back to Trainn</a>
  </nav>
  
  <header class="header">
    <h1>Outdoor Workouts in San Francisco</h1>
    <p>Train at the city's most beautiful parks and beaches with certified fitness coaches</p>
    <a href="https://trainn.pro/classes?city=San%20Francisco" class="cta-button">View All Classes</a>
  </header>

  <div class="container">
    <section class="section">
      <h2>Featured Outdoor Fitness Classes</h2>
      <div class="classes-grid">
        ${classes.slice(0, 6).map(cls => `
          <div class="class-card">
            <div class="class-image">${cls.category.name}</div>
            <div class="class-content">
              <h3 class="class-title">${cls.title}</h3>
              <div class="class-coach">with ${cls.coach.displayBusinessName && cls.coach.businessName ? cls.coach.businessName : `${cls.coach.firstName} ${cls.coach.lastName}`}</div>
              <div class="class-location">📍 ${cls.location}</div>
              <div class="class-price">$${cls.price}/class</div>
              <p class="class-description">${cls.description.substring(0, 120)}...</p>
              <a href="https://trainn.pro/classes/${cls.id}" class="cta-button" style="font-size: 0.9rem; padding: 10px 20px;">Book Now</a>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="benefits">
      <h2 style="text-align: center; margin-bottom: 20px;">Why Choose Outdoor Workouts in SF?</h2>
      <div class="benefits-grid">
        <div class="benefit">
          <div class="benefit-icon">🌲</div>
          <h3>Beautiful Locations</h3>
          <p>Train in Golden Gate Park, Dolores Park, Marina Green, and other iconic SF locations</p>
        </div>
        <div class="benefit">
          <div class="benefit-icon">💨</div>
          <h3>Fresh Air & Views</h3>
          <p>Enjoy San Francisco's famous views while getting fit in the great outdoors</p>
        </div>
        <div class="benefit">
          <div class="benefit-icon">👥</div>
          <h3>Expert Coaches</h3>
          <p>All coaches are certified and approved, bringing years of experience to your workout</p>
        </div>
        <div class="benefit">
          <div class="benefit-icon">📱</div>
          <h3>Easy Booking</h3>
          <p>Drop-in classes with simple online booking - no long-term commitments required</p>
        </div>
      </div>
    </section>

    <section class="locations">
      <h2>Popular Outdoor Workout Locations</h2>
      <ul style="padding: 0;">
        <li><strong>Dolores Park</strong> - Yoga, HIIT, and strength training with city views</li>
        <li><strong>Golden Gate Park</strong> - Cardio and circuit training in nature</li>
        <li><strong>Marina Green</strong> - Waterfront workouts with Golden Gate Bridge views</li>
        <li><strong>Baker Beach</strong> - Beach yoga and outdoor bootcamps</li>
        <li><strong>Presidio</strong> - Trail running and outdoor fitness in historic setting</li>
        <li><strong>Embarcadero</strong> - Waterfront walks and outdoor training sessions</li>
      </ul>
    </section>

    <section class="faq">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-item">
        <div class="faq-question">What should I bring to outdoor fitness classes?</div>
        <div class="faq-answer">Bring a yoga mat, water bottle, towel, and dress in layers. Most instructors provide additional equipment needed for the workout.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">Do I need to be in shape to join outdoor classes?</div>
        <div class="faq-answer">Classes welcome all fitness levels. Instructors provide modifications for beginners and advanced participants alike.</div>
      </div>
      <div class="faq-item">
        <div class="faq-question">How do I book an outdoor workout class?</div>
        <div class="faq-answer">Simply click "Book Now" on any class above, create an account, and secure your spot with easy online payment.</div>
      </div>
    </section>

    <section class="section" style="text-align: center; background: #f8f9fa; padding: 40px; border-radius: 12px;">
      <h2>Ready to Start Your Outdoor Fitness Journey?</h2>
      <p style="font-size: 1.1rem; margin: 20px 0;">Join thousands of San Francisco residents who choose outdoor workouts for better health and amazing city views.</p>
      <a href="https://trainn.pro/classes?city=San%20Francisco" class="cta-button" style="font-size: 1.1rem; padding: 15px 30px;">Browse All Classes</a>
    </section>
  </div>

  <!-- Analytics would go here -->
</body>
</html>`;

      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error generating outdoor workouts landing page:", error);
      res.status(500).send("Error loading page");
    }
  });

  // Test endpoint to send newsletter to sam@trainn.pro
  app.post("/api/test/send-newsletter", async (req, res) => {
    try {
      const { sendWeeklyNewsletterEmail } = await import('./email');
      
      // Fetch real newsletter data
      const [upcomingKidsClasses, upcomingAdultClasses, newProviders, recentReviews] = await Promise.all([
        storage.getUpcomingKidsClassesForNewsletter(),
        storage.getUpcomingAdultClassesForNewsletter(), 
        storage.getRecentlyJoinedProviders(30),
        storage.getRecentReviewsForNewsletter()
      ]);
      
      // Create test user for Sam
      const testUser = {
        id: 0,
        email: 'sam@trainn.pro',
        firstName: 'Sam',
        lastName: 'Test',
        role: 'customer' as const,
        isApproved: true,
        createdAt: new Date(),
        stripeCustomerId: null,
        stripeConnectId: null,
        stripeConnectOnboarded: false,
        bankAccountVerified: false,
        password: null,
        phone: null,
        bio: null,
        profileImage: null,
        areasOfExpertise: [],
        certifications: null,
        googleId: null,
        authMethod: 'password' as const,
        googleProfilePicture: null,
        referralCode: null,
        providerReferralCode: null,
        businessName: null,
        displayBusinessName: false
      };
      
      // Send newsletter
      const success = await sendWeeklyNewsletterEmail({
        customer: testUser,
        upcomingKidsClasses,
        upcomingAdultClasses,
        newProviders,
        recentReviews
      });
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Test newsletter sent to sam@trainn.pro',
          stats: {
            kidsClasses: upcomingKidsClasses.length,
            adultClasses: upcomingAdultClasses.length,
            newProviders: newProviders.length,
            recentReviews: recentReviews.length
          }
        });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send newsletter' });
      }
    } catch (error) {
      console.error('Error sending test newsletter:', error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ========== SUBSCRIPTION ROUTES ==========
  
  // Get all active subscription plans
  app.get("/api/subscriptions/plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get user's active subscription
  app.get("/api/subscriptions/my", requireAuth, async (req, res) => {
    try {
      const subscription = await storage.getActiveUserSubscription(req.user.id);
      
      if (!subscription) {
        return res.json(null);
      }
      
      // Get the plan details
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      
      // Get total classes taken all time
      const totalClassesTaken = await storage.getTotalClassesTakenWithSubscription(req.user.id);
      
      res.json({
        ...subscription,
        plan,
        totalClassesTaken,
        classesRemaining: subscription.classesAllottedThisPeriod === -1 
          ? 'unlimited' 
          : subscription.classesAllottedThisPeriod - subscription.classesUsedThisPeriod
      });
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Get subscription usage history
  app.get("/api/subscriptions/usage", requireAuth, async (req, res) => {
    try {
      const usage = await storage.getUserSubscriptionUsageHistory(req.user.id);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching subscription usage:", error);
      res.status(500).json({ message: "Failed to fetch usage history" });
    }
  });

  // Sync subscription from Stripe (for missed webhooks)
  app.post("/api/subscriptions/sync", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const user = req.user;
      
      // Check if user already has an active subscription in our database
      const existingSubscription = await storage.getActiveUserSubscription(user.id);
      if (existingSubscription) {
        return res.json({ 
          message: "Subscription already exists", 
          subscription: existingSubscription 
        });
      }

      // Check Stripe for active subscriptions
      if (!user.stripeCustomerId) {
        return res.status(404).json({ message: "No Stripe customer found for this user" });
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return res.status(404).json({ message: "No active subscription found in Stripe" });
      }

      const stripeSubscription = subscriptions.data[0];
      
      // Find the matching plan by Stripe price ID
      const priceId = stripeSubscription.items.data[0]?.price?.id;
      const plans = await storage.getActiveSubscriptionPlans();
      const matchingPlan = plans.find(p => p.stripePriceId === priceId);
      
      if (!matchingPlan) {
        // Try to match by price amount
        const priceAmount = stripeSubscription.items.data[0]?.price?.unit_amount;
        const matchByPrice = plans.find(p => Math.round(p.monthlyPrice * 100) === priceAmount);
        
        if (!matchByPrice) {
          return res.status(404).json({ 
            message: "Could not match Stripe subscription to a plan",
            stripePriceId: priceId,
            priceAmount: priceAmount
          });
        }
        
        // Create subscription with matched plan
        const newSubscription = await storage.createUserSubscription({
          userId: user.id,
          planId: matchByPrice.id,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: stripeSubscription.customer as string,
          status: 'active',
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          classesUsedThisPeriod: 0,
          classesAllottedThisPeriod: matchByPrice.isUnlimited ? -1 : (matchByPrice.classesPerMonth || 0),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        });

        console.log(`Synced subscription for user ${user.id}, plan ${matchByPrice.id} (matched by price)`);
        return res.json({ 
          message: "Subscription synced successfully", 
          subscription: newSubscription 
        });
      }

      // Create subscription with matched plan (by price ID)
      const newSubscription = await storage.createUserSubscription({
        userId: user.id,
        planId: matchingPlan.id,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer as string,
        status: 'active',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        classesUsedThisPeriod: 0,
        classesAllottedThisPeriod: matchingPlan.isUnlimited ? -1 : (matchingPlan.classesPerMonth || 0),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      });

      console.log(`Synced subscription for user ${user.id}, plan ${matchingPlan.id}`);
      return res.json({ 
        message: "Subscription synced successfully", 
        subscription: newSubscription 
      });

    } catch (error) {
      console.error("Error syncing subscription:", error);
      res.status(500).json({ message: "Failed to sync subscription" });
    }
  });

  // Admin endpoint to sync subscription by user ID
  app.post("/api/admin/subscriptions/sync/:userId", requireAdmin, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has an active subscription in our database
      const existingSubscription = await storage.getActiveUserSubscription(userId);
      if (existingSubscription) {
        return res.json({ 
          message: "Subscription already exists", 
          subscription: existingSubscription 
        });
      }

      // Check Stripe for active subscriptions
      if (!user.stripeCustomerId) {
        return res.status(404).json({ message: "No Stripe customer found for this user" });
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return res.status(404).json({ message: "No active subscription found in Stripe" });
      }

      const stripeSubscription = subscriptions.data[0];
      
      // Find the matching plan by Stripe price ID or amount
      const priceId = stripeSubscription.items.data[0]?.price?.id;
      const priceAmount = stripeSubscription.items.data[0]?.price?.unit_amount;
      const plans = await storage.getActiveSubscriptionPlans();
      
      let matchingPlan = plans.find(p => p.stripePriceId === priceId);
      if (!matchingPlan) {
        matchingPlan = plans.find(p => Math.round(p.monthlyPrice * 100) === priceAmount);
      }
      
      if (!matchingPlan) {
        return res.status(404).json({ 
          message: "Could not match Stripe subscription to a plan",
          stripePriceId: priceId,
          priceAmount: priceAmount
        });
      }

      // Create subscription record
      const newSubscription = await storage.createUserSubscription({
        userId: user.id,
        planId: matchingPlan.id,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer as string,
        status: 'active',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        classesUsedThisPeriod: 0,
        classesAllottedThisPeriod: matchingPlan.isUnlimited ? -1 : (matchingPlan.classesPerMonth || 0),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      });

      console.log(`Admin synced subscription for user ${user.id}, plan ${matchingPlan.id}`);
      return res.json({ 
        message: "Subscription synced successfully", 
        subscription: newSubscription,
        user: { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` },
        plan: matchingPlan
      });

    } catch (error) {
      console.error("Error syncing subscription:", error);
      res.status(500).json({ message: "Failed to sync subscription" });
    }
  });

  // Create Stripe Checkout session for subscription
  app.post("/api/subscriptions/checkout", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Check if user already has an active subscription
      const existingSubscription = await storage.getActiveUserSubscription(req.user.id);
      if (existingSubscription) {
        return res.status(400).json({ message: "You already have an active subscription" });
      }

      // Get or create Stripe customer
      let stripeCustomerId = req.user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: `${req.user.firstName} ${req.user.lastName}`,
          metadata: {
            userId: req.user.id.toString()
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(req.user.id, { stripeCustomerId });
      }

      // Create or get Stripe price for this plan
      let stripePriceId = plan.stripePriceId;
      if (!stripePriceId) {
        // Create a product and price in Stripe
        let stripeProductId = plan.stripeProductId;
        if (!stripeProductId) {
          const product = await stripe.products.create({
            name: `Trainn ${plan.name}`,
            description: plan.isUnlimited 
              ? 'Unlimited monthly classes subscription'
              : `${plan.classesPerMonth} classes per month subscription`,
            metadata: {
              planId: plan.id.toString()
            }
          });
          stripeProductId = product.id;
        }

        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(plan.monthlyPrice * 100), // Convert to cents
          currency: 'usd',
          recurring: {
            interval: 'month',
            interval_count: 1
          },
          metadata: {
            planId: plan.id.toString()
          }
        });
        stripePriceId = price.id;

        // Save the Stripe IDs to the plan
        await storage.updateSubscriptionPlan(plan.id, { 
          stripePriceId, 
          stripeProductId 
        });
      }

      // Determine the base URL for return redirect
      const host = req.get('host');
      const baseUrl = host?.includes('trainn.pro') 
        ? 'https://trainn.pro'
        : `https://${host}`;

      // Create Stripe Checkout session with embedded mode
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        ui_mode: 'embedded',
        return_url: `${baseUrl}/plans?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          userId: req.user.id.toString(),
          planId: plan.id.toString()
        },
        subscription_data: {
          metadata: {
            userId: req.user.id.toString(),
            planId: plan.id.toString()
          }
        }
      });

      res.json({ clientSecret: session.client_secret });
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Cancel subscription (at end of billing period)
  app.post("/api/subscriptions/cancel", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const subscription = await storage.getActiveUserSubscription(req.user.id);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update our database
      await storage.updateUserSubscription(subscription.id, {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date()
      });

      res.json({ 
        message: "Subscription will be cancelled at the end of your billing period",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.currentPeriodEnd
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Reactivate cancelled subscription (before period ends)
  app.post("/api/subscriptions/reactivate", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const subscription = await storage.getActiveUserSubscription(req.user.id);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      if (!subscription.cancelAtPeriodEnd) {
        return res.status(400).json({ message: "Subscription is not scheduled for cancellation" });
      }

      // Reactivate in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      // Update our database
      await storage.updateUserSubscription(subscription.id, {
        cancelAtPeriodEnd: false,
        cancelledAt: null
      });

      res.json({ 
        message: "Subscription has been reactivated",
        cancelAtPeriodEnd: false
      });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ message: "Failed to reactivate subscription" });
    }
  });

  // Change subscription plan
  app.post("/api/subscriptions/change-plan", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { newPlanId } = req.body;
      if (!newPlanId) {
        return res.status(400).json({ message: "New plan ID is required" });
      }

      const subscription = await storage.getActiveUserSubscription(req.user.id);
      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      if (subscription.planId === newPlanId) {
        return res.status(400).json({ message: "This is already your current plan" });
      }

      const newPlan = await storage.getSubscriptionPlan(newPlanId);
      if (!newPlan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Get or create Stripe price for the new plan
      let stripePriceId = newPlan.stripePriceId;
      if (!stripePriceId) {
        // Create product and price in Stripe if not exists
        let stripeProductId = newPlan.stripeProductId;
        if (!stripeProductId) {
          const product = await stripe.products.create({
            name: newPlan.name,
            description: newPlan.isUnlimited 
              ? 'Unlimited monthly classes' 
              : `${newPlan.classesPerMonth} classes per month`,
          });
          stripeProductId = product.id;
          await storage.updateSubscriptionPlan(newPlan.id, { stripeProductId });
        }

        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(newPlan.monthlyPrice * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        stripePriceId = price.id;
        await storage.updateSubscriptionPlan(newPlan.id, { stripePriceId });
      }

      // Get the Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      const subscriptionItemId = stripeSubscription.items.data[0].id;

      // Update the subscription to the new plan (takes effect at next billing cycle)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: stripePriceId,
        }],
        proration_behavior: 'none', // Change takes effect at next billing cycle, no proration
      });

      // Update our database with the new plan
      await storage.updateUserSubscription(subscription.id, {
        planId: newPlanId,
        classesAllottedThisPeriod: newPlan.isUnlimited ? -1 : (newPlan.classesPerMonth || 0),
      });

      res.json({ 
        message: "Your plan has been changed successfully",
        newPlan: newPlan,
        effectiveDate: subscription.currentPeriodEnd
      });
    } catch (error) {
      console.error("Error changing subscription plan:", error);
      res.status(500).json({ message: "Failed to change subscription plan" });
    }
  });

  // Stripe webhook for subscription events
  app.post("/api/webhooks/stripe-subscriptions", 
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.warn("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET not configured");
        return res.status(400).json({ message: "Webhook secret not configured" });
      }

      let event: Stripe.Event;

      try {
        const sig = req.headers['stripe-signature'] as string;
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            
            // Only handle subscription mode checkouts
            if (session.mode !== 'subscription') {
              console.log('Skipping non-subscription checkout session');
              break;
            }

            const userId = parseInt(session.metadata?.userId || '');
            const planId = parseInt(session.metadata?.planId || '');
            
            if (!userId || !planId) {
              console.error('Missing userId or planId in checkout session metadata');
              break;
            }

            // Check if subscription already exists (from customer.subscription.created event)
            const stripeSubscriptionId = session.subscription as string;
            const existingSubscription = await storage.getUserSubscriptionByStripeId(stripeSubscriptionId);
            
            if (existingSubscription) {
              console.log('Subscription already exists, skipping:', stripeSubscriptionId);
              break;
            }

            // Retrieve the full subscription from Stripe
            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            
            const plan = await storage.getSubscriptionPlan(planId);
            if (!plan) {
              console.error('Plan not found:', planId);
              break;
            }

            // Create user subscription record
            await storage.createUserSubscription({
              userId,
              planId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              status: 'active',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              classesUsedThisPeriod: 0,
              classesAllottedThisPeriod: plan.isUnlimited ? -1 : (plan.classesPerMonth || 0),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            });

            console.log(`Created subscription from checkout.session.completed for user ${userId}, plan ${planId}`);
            break;
          }

          case 'customer.subscription.created': {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = parseInt(subscription.metadata.userId);
            const planId = parseInt(subscription.metadata.planId);
            
            if (!userId || !planId) {
              console.error('Missing userId or planId in subscription metadata');
              break;
            }

            const plan = await storage.getSubscriptionPlan(planId);
            if (!plan) {
              console.error('Plan not found:', planId);
              break;
            }

            // Create user subscription record
            await storage.createUserSubscription({
              userId,
              planId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              status: 'active',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              classesUsedThisPeriod: 0,
              classesAllottedThisPeriod: plan.isUnlimited ? -1 : (plan.classesPerMonth || 0),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            });

            console.log(`Created subscription for user ${userId}, plan ${planId}`);
            break;
          }

          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            console.log(`🔄 Processing subscription update: ${subscription.id}, status: ${subscription.status}`);
            
            const existingSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
            
            if (!existingSubscription) {
              console.warn(`⚠️ Subscription not found in database: ${subscription.id}`);
              break;
            }

            // Handle period renewal - reset usage count
            const newPeriodStart = new Date(subscription.current_period_start * 1000);
            const newPeriodEnd = new Date(subscription.current_period_end * 1000);
            const currentPeriodStart = existingSubscription.currentPeriodStart;
            
            console.log(`📅 Period check - Current: ${currentPeriodStart.toISOString()}, New: ${newPeriodStart.toISOString()}`);
            
            if (newPeriodStart.getTime() > currentPeriodStart.getTime()) {
              // New billing period - reset usage
              await storage.resetSubscriptionUsageForNewPeriod(
                existingSubscription.id,
                newPeriodStart,
                newPeriodEnd
              );
              console.log(`✅ Reset subscription ${existingSubscription.id} usage for new period: ${newPeriodStart.toISOString()} - ${newPeriodEnd.toISOString()}`);
            } else {
              console.log(`ℹ️ No period change detected for subscription ${existingSubscription.id}`);
            }

            // Update status and cancel_at_period_end
            const statusMap: Record<string, string> = {
              'active': 'active',
              'past_due': 'past_due',
              'canceled': 'cancelled',
              'incomplete': 'active',
              'incomplete_expired': 'cancelled',
              'trialing': 'active',
              'unpaid': 'past_due',
              'paused': 'paused'
            };

            await storage.updateUserSubscription(existingSubscription.id, {
              status: statusMap[subscription.status] || 'active',
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            });
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const existingSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
            
            if (existingSubscription) {
              await storage.updateUserSubscription(existingSubscription.id, {
                status: 'cancelled',
                cancelledAt: new Date()
              });
              console.log(`Cancelled subscription: ${existingSubscription.id}`);
            }
            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            if (invoice.subscription) {
              const existingSubscription = await storage.getUserSubscriptionByStripeId(invoice.subscription as string);
              if (existingSubscription) {
                await storage.updateUserSubscription(existingSubscription.id, {
                  status: 'past_due'
                });
                console.log(`Marked subscription as past_due: ${existingSubscription.id}`);
              }
            }
            break;
          }

          case 'invoice.paid': {
            // Handle successful renewal payments - backup for customer.subscription.updated
            const invoice = event.data.object as Stripe.Invoice;
            
            // Only process subscription renewal invoices (not first payments)
            if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
              console.log(`📧 Processing subscription renewal invoice: ${invoice.id}`);
              
              const stripeSubscriptionId = invoice.subscription as string;
              const existingSubscription = await storage.getUserSubscriptionByStripeId(stripeSubscriptionId);
              
              if (existingSubscription) {
                // Fetch latest subscription data from Stripe
                const stripeSubscription = await stripe!.subscriptions.retrieve(stripeSubscriptionId);
                const newPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
                const newPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
                
                // Check if we need to update the period (may have already been done by subscription.updated)
                if (newPeriodStart.getTime() > existingSubscription.currentPeriodStart.getTime()) {
                  await storage.resetSubscriptionUsageForNewPeriod(
                    existingSubscription.id,
                    newPeriodStart,
                    newPeriodEnd
                  );
                  console.log(`✅ Reset subscription ${existingSubscription.id} for new period: ${newPeriodStart.toISOString()} - ${newPeriodEnd.toISOString()}`);
                } else {
                  console.log(`ℹ️ Subscription ${existingSubscription.id} already updated for current period`);
                }
                
                // Ensure status is active after successful payment
                await storage.updateUserSubscription(existingSubscription.id, {
                  status: 'active'
                });
              } else {
                console.warn(`⚠️ Subscription not found for invoice: ${stripeSubscriptionId}`);
              }
            }
            break;
          }
        }

        res.json({ received: true });
      } catch (error) {
        console.error('Error processing webhook event:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
      }
    }
  );

  // ========== SUBSCRIPTION BOOKING ROUTE ==========
  
  // Book a class using subscription (no customer payment required)
  app.post("/api/bookings/subscription", requireAuth, async (req, res) => {
    try {
      const { classId, quantity = 1 } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      // Get user's active subscription
      const subscription = await storage.getActiveUserSubscription(req.user.id);
      if (!subscription) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Check subscription status
      if (subscription.status !== 'active') {
        return res.status(400).json({ message: "Subscription is not active" });
      }

      // Get the subscription plan
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return res.status(400).json({ message: "Subscription plan not found" });
      }

      // Check remaining classes (unless unlimited)
      if (!plan.isUnlimited) {
        const classesRemaining = subscription.classesAllottedThisPeriod - subscription.classesUsedThisPeriod;
        if (classesRemaining < quantity) {
          return res.status(400).json({ 
            message: `Not enough subscription classes remaining. You have ${classesRemaining} class${classesRemaining !== 1 ? 'es' : ''} left this month.`
          });
        }
      }

      // Get class details
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Check if class price is eligible (under $40)
      const MAX_SUBSCRIPTION_CLASS_PRICE = 40;
      if (classItem.price > MAX_SUBSCRIPTION_CLASS_PRICE) {
        return res.status(400).json({ 
          message: `This class costs $${classItem.price}, which exceeds the $${MAX_SUBSCRIPTION_CLASS_PRICE} subscription limit. Please pay for this class separately.`
        });
      }

      // Check available spots
      const confirmedCount = await storage.getConfirmedBookingsCount(classId);
      const availableSpots = classItem.capacity - confirmedCount;
      if (quantity > availableSpots) {
        return res.status(400).json({ 
          message: `Only ${availableSpots} spot${availableSpots !== 1 ? 's' : ''} available in this class` 
        });
      }

      // Check for existing booking
      const existingBooking = await storage.getBookingByUserAndClass(req.user.id, classId);
      if (existingBooking && existingBooking.status === 'confirmed') {
        return res.status(400).json({ message: "You have already booked this class" });
      }

      // Create the booking with subscription payment method
      const booking = await storage.createBooking({
        userId: req.user.id,
        classId: classId,
        quantity: quantity,
        status: "confirmed",
        paymentMethod: "subscription",
        stripePaymentIntentId: null, // No payment intent for subscription bookings
        paymentDate: new Date()
      });

      // Record subscription usage
      await storage.createSubscriptionUsage({
        subscriptionId: subscription.id,
        userId: req.user.id,
        bookingId: booking.id,
        classId: classId,
        coachId: classItem.coachId,
        classPrice: classItem.price,
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
        usedAt: new Date()
      });

      // Increment subscription usage counter
      await storage.incrementSubscriptionUsage(subscription.id);

      // Create scheduled payout for provider (85% of class price, paid from Trainn account)
      const classPriceCents = Math.round(classItem.price * 100);
      const providerPayoutCents = Math.round(classItem.price * 0.85 * 100); // 85% to provider
      const platformFeeCents = classPriceCents - providerPayoutCents; // 15% platform fee
      const classStartTime = new Date(classItem.startTime);
      const payoutDate = new Date(classStartTime);
      payoutDate.setDate(payoutDate.getDate() + 2); // 2 days after class

      await storage.createScheduledPayout({
        bookingId: booking.id,
        classId: classId,
        coachId: classItem.coachId,
        customerId: req.user.id,
        amountCents: classPriceCents, // Full class price
        stripeFee: 0, // No Stripe fee for subscription bookings (paid from Trainn account)
        netAmount: classPriceCents, // Full amount since no payment processing
        coachPayout: providerPayoutCents, // 85% to coach
        platformFee: platformFeeCents, // 15% platform fee
        payoutType: 'subscription_booking',
        status: 'scheduled',
        scheduledPayoutDate: payoutDate
      });

      // Send confirmation emails (matching regular booking flow)
      try {
        // Get coach details for email
        const coach = await storage.getUser(classItem.coachId);
        
        if (coach) {
          // Send customer confirmation email
          await sendBookingConfirmation({
            booking,
            classData: classItem,
            customer: req.user,
            coach,
            pricingDetails: {
              originalPrice: classItem.price,
              finalPrice: 0, // No charge - paid via subscription
              subscriptionUsed: true
            }
          });
          
          // Send notification to coach
          await sendNewBookingNotificationToCoach(
            coach,
            req.user,
            classItem,
            booking
          );

          // Send admin notification
          try {
            await sendBookingAdminNotification({
              booking,
              classData: classItem,
              customer: req.user,
              coach,
              bookingType: 'subscription',
              paymentAmount: 0
            });
          } catch (adminEmailError) {
            console.error("Admin notification error:", adminEmailError);
          }
        }
      } catch (emailError) {
        console.error('Error sending booking confirmation emails:', emailError);
        // Don't fail the booking if email fails
      }

      res.json({
        success: true,
        message: "Class booked successfully with your subscription!",
        booking,
        classesUsedThisPeriod: subscription.classesUsedThisPeriod + quantity,
        classesRemaining: plan.isUnlimited ? 'unlimited' : 
          (subscription.classesAllottedThisPeriod - subscription.classesUsedThisPeriod - quantity)
      });
    } catch (error) {
      console.error("Error booking with subscription:", error);
      res.status(500).json({ message: "Failed to book class with subscription" });
    }
  });

  // ========== Class Waitlist Endpoints ==========
  
  // Join waitlist for a full class
  app.post("/api/waitlist", requireAuth, async (req, res) => {
    try {
      const { classId, classDate, classTime, className, providerName } = req.body;
      
      if (!classId || !classDate || !classTime || !className || !providerName) {
        return res.status(400).json({ message: "Missing required waitlist data" });
      }
      
      const user = req.user as any;
      
      // Check for duplicate entry
      const existingEntry = await storage.getWaitlistEntry(user.id, classId, classDate);
      if (existingEntry) {
        return res.status(400).json({ message: "You're already on the waitlist for this class" });
      }
      
      // Create waitlist entry
      const waitlistEntry = await storage.addToWaitlist({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        classId,
        className,
        classDate,
        classTime,
        providerName,
        status: 'waiting'
      });
      
      console.log(`✅ User ${user.id} joined waitlist for class ${classId} on ${classDate}`);
      
      res.json({
        success: true,
        message: "You've been added to the waitlist!",
        waitlistEntry
      });
    } catch (error) {
      console.error("Error joining waitlist:", error);
      res.status(500).json({ message: "Failed to join waitlist" });
    }
  });
  
  // Check if user is on waitlist for a specific class instance
  app.get("/api/waitlist/check", requireAuth, async (req, res) => {
    try {
      const { classId, classDate } = req.query;
      
      if (!classId || !classDate) {
        return res.status(400).json({ message: "Missing classId or classDate" });
      }
      
      const user = req.user as any;
      const entry = await storage.getWaitlistEntry(user.id, Number(classId), classDate as string);
      
      res.json({
        onWaitlist: !!entry,
        entry: entry || null
      });
    } catch (error) {
      console.error("Error checking waitlist:", error);
      res.status(500).json({ message: "Failed to check waitlist status" });
    }
  });
  
  // Get user's waitlist entries
  app.get("/api/waitlist/my", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const entries = await storage.getUserWaitlistEntries(user.id);
      res.json(entries);
    } catch (error) {
      console.error("Error getting user waitlist:", error);
      res.status(500).json({ message: "Failed to get waitlist entries" });
    }
  });

  // Remove from waitlist (leave waitlist)
  app.delete("/api/waitlist/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const entryId = parseInt(req.params.id);
      
      // Verify the entry belongs to the user
      const entries = await storage.getUserWaitlistEntries(user.id);
      const entry = entries.find(e => e.id === entryId);
      
      if (!entry) {
        return res.status(404).json({ message: "Waitlist entry not found" });
      }
      
      const success = await storage.removeFromWaitlist(entryId);
      if (success) {
        res.json({ success: true, message: "Removed from waitlist" });
      } else {
        res.status(500).json({ message: "Failed to remove from waitlist" });
      }
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      res.status(500).json({ message: "Failed to remove from waitlist" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
