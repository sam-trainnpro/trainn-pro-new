import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  sendBookingConfirmation, 
  sendNewBookingNotificationToCoach, 
  sendWelcomeEmail,
  sendCoachApprovalNotification,
  sendBookingCancellationConfirmation
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
      callbackUrl: `https://trainn-samuelroth.replit.app/api/auth/google/callback`,
      domain: process.env.REPLIT_DOMAINS?.split(',')[0],
      status: 'APIs enabled - ready for testing'
    };
    res.json(config);
  });

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('Google OAuth route hit with query:', req.query);
    console.log('Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    
    const { role } = req.query;
    const state = role ? JSON.stringify({ role }) : undefined;
    
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state,
      accessType: 'offline',
      prompt: 'select_account'
    })(req, res, next);
  });

  app.get('/api/auth/google/callback', 
    (req, res, next) => {
      console.log('Google callback hit with query:', req.query);
      console.log('Google callback state:', req.query.state);
      passport.authenticate('google', { 
        failureRedirect: '/auth?error=google_auth_failed',
        failureMessage: true 
      })(req, res, next);
    },
    async (req, res) => {
      try {
        console.log('Google callback success, user:', req.user ? 'found' : 'not found');
        const user = req.user;
        if (!user) {
          return res.redirect('/auth?error=no_user');
        }

        // Handle role preference from state
        const state = req.query.state;
        if (state && typeof state === 'string') {
          try {
            const { role } = JSON.parse(state);
            if (role === 'coach' && user.role === 'customer') {
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

        // Redirect to home page on successful authentication
        res.redirect('/');
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect('/auth?error=callback_error');
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

  // Get all classes
  app.get("/api/classes", async (req, res) => {
    try {
      // Check if we want to include schedules
      const includeSchedules = req.query.includeSchedules === 'true';
      
      if (includeSchedules) {
        const classesWithSchedules = await storage.getClassesWithSchedules();
        res.json(classesWithSchedules);
      } else {
        const classes = await storage.getClasses();
        res.json(classes);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
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
  app.post("/api/upload-image", requireAuth, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        console.error("No file received in upload request");
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      console.log("File upload successful:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
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
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "File upload failed" });
    }
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
        changes.push(`Date/time changed to ${newDate.toLocaleDateString()} at ${newDate.toLocaleTimeString()}`);
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
      
      if (confirmedBookings.length >= classItem.capacity) {
        return res.status(400).json({ message: "Class is fully booked" });
      }
      
      // Return availability status
      res.json({ 
        available: true, 
        spotsLeft: classItem.capacity - confirmedBookings.length 
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
        spotsLeft: classItem.capacity - totalSpotsBooked
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
      
      const updatedBooking = await storage.updateBooking(bookingId, { status: "cancelled" });

      // Send booking cancellation confirmation email
      try {
        const classItem = await storage.getClass(booking.classId);
        if (classItem) {
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
      const { classId, amount, quantity = 1, promoCode } = req.body;
      
      if (!classId || !amount) {
        return res.status(400).json({ message: "Missing required parameters: classId, amount" });
      }

      let finalAmount = parseFloat(amount);
      let promoCodeData = null;
      let originalClassPrice = 0; // Store the original class price for metadata

      // Get class details to get the original price before any discounts
      const classDetailsForPrice = await storage.getClass(parseInt(classId));
      if (classDetailsForPrice) {
        originalClassPrice = classDetailsForPrice.price * quantity; // Original total price
      }

      // Apply promo code discount if provided
      if (promoCode) {
        const validation = await storage.validatePromoCode(promoCode, req.user!.id, classId);
        if (validation.valid && validation.promoCode) {
          const classDetails = await storage.getClass(parseInt(classId));
          if (classDetails) {
            const discountCalc = await storage.calculateDiscount(validation.promoCode, classDetails.price * quantity * 100);
            // Convert back to dollars and add 5% fee
            const discountedAmount = discountCalc.finalAmount / 100;
            finalAmount = discountedAmount + (discountedAmount * 0.05);
            promoCodeData = validation.promoCode;
            
            console.log(`Promo code ${promoCode} applied: Original $${originalClassPrice.toFixed(2)}, Final $${finalAmount.toFixed(2)}`);
          }
        }
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
              discountApplied: promoCodeData ? 'true' : 'false'
            }
          };

          // Don't transfer immediately - we'll handle delayed payouts after class completion
          // Store coach payout info in metadata for later processing
          paymentIntentData.metadata.delayedPayout = 'true';
          paymentIntentData.metadata.coachStripeId = coach.stripeConnectId || '';
          paymentIntentData.metadata.coachOnboarded = coach.stripeConnectOnboarded ? 'true' : 'false';

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
      
      // Check if user already has a booking for this class
      const userBooking = existingBookings.find(b => b.userId === req.user.id);
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
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
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

  // Create free booking with promo code (100% discount)
  app.post("/api/bookings/free-promo", requireAuth, async (req, res) => {
    try {
      const { classId, quantity = 1, promoCode } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }
      
      if (!promoCode) {
        return res.status(400).json({ message: "Promo code is required for this endpoint" });
      }
      
      // Validate class exists
      const classDetails = await storage.getClass(parseInt(classId));
      if (!classDetails) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Validate promo code provides 100% discount
      const promoCodeRecord = await storage.getPromoCodeByCode(promoCode);
      if (!promoCodeRecord) {
        return res.status(400).json({ message: "Invalid promo code" });
      }
      
      // Calculate discount to verify it's 100%
      let discountAmount = 0;
      const originalAmount = classDetails.price * quantity * 100; // Amount in cents
      
      if (promoCodeRecord.discountType === 'percentage') {
        discountAmount = Math.round((originalAmount * promoCodeRecord.discountValue) / 100);
      } else {
        discountAmount = Math.round(promoCodeRecord.discountValue * 100); // Convert to cents
      }
      
      const finalAmount = Math.max(0, originalAmount - discountAmount);
      
      if (finalAmount > 0) {
        return res.status(400).json({ message: "This endpoint is only for 100% discount promo codes" });
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
      
      // Check if user already has a booking for this class
      const userBooking = existingBookings.find(b => b.userId === req.user.id);
      if (userBooking) {
        return res.status(400).json({ message: "You have already booked this class" });
      }
      
      // Record promo code usage
      const subsidyAmount = originalAmount - discountAmount; // Platform covers the discount
      await storage.recordPromoCodeUsage({
        promoCodeId: promoCodeRecord.id,
        userId: req.user.id,
        classId: parseInt(classId),
        discountAmount: discountAmount,
        subsidyAmount: subsidyAmount,
        originalAmount: originalAmount
      });
      
      // Create confirmed booking directly for free promo booking
      const booking = await storage.createBooking({
        userId: req.user.id,
        classId: parseInt(classId),
        quantity: quantity,
        status: 'confirmed',
        paymentMethod: 'promo_free'
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
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }
      
      res.json({ 
        success: true, 
        booking,
        message: `Free class booking confirmed with promo code ${promoCode} for ${quantity} spot(s)` 
      });
    } catch (error: any) {
      console.error("Free promo booking error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Confirm payment and create confirmed booking
  app.post("/api/payment/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, classId, quantity = 1 } = req.body;
      
      console.log("=== PAYMENT CONFIRMATION STARTED ===");
      console.log("Payment Intent ID:", paymentIntentId);
      console.log("Class ID:", classId);
      console.log("Quantity:", quantity);
      console.log("User:", req.user.id, req.user.email);
      
      if (!paymentIntentId || !classId) {
        console.log("Missing required fields - paymentIntentId:", paymentIntentId, "classId:", classId);
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
            console.log("Detected payment method:", paymentMethod);
          }
        } catch (stripeError) {
          console.log("Could not retrieve payment method from Stripe, using default:", stripeError);
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
              console.log(`Promo code ${promoCode.code} was used in this payment`);
            }
          }
        } catch (stripeError) {
          console.log("Could not retrieve promo code from payment intent:", stripeError);
        }
      }

      // Create new confirmed booking directly (no pending status)
      console.log("Creating booking with data:", {
        userId: req.user.id,
        classId: parseInt(classId),
        quantity: quantity,
        status: "confirmed",
        stripePaymentIntentId: paymentIntentId,
        paymentMethod: paymentMethod
      });
      
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
          console.log("=== PROMO CODE USAGE RECORDING ===");
          console.log("Payment Intent Metadata:", paymentIntent.metadata);
          console.log("Payment Intent Amount (charged):", paymentIntent.amount);
          
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
            
            console.log("=== SUBSIDY CALCULATION ===");
            console.log("Original class price (cents):", originalClassPrice);
            console.log("Discounted class price (cents):", discountedPrice);
            console.log("Original coach payout (cents):", originalCoachPayout);
            console.log("Discounted coach payout (cents):", discountedCoachPayout);
            console.log("Platform subsidy needed (cents):", subsidyAmount);
          }

          console.log("Original Class Price (cents):", originalClassPrice);
          console.log("Actual Discount Applied (cents):", actualDiscountAmount);
          console.log("Platform Subsidy Amount (cents):", subsidyAmount);

          await storage.recordPromoCodeUsage({
            promoCodeId: promoCodeUsed.id,
            userId: req.user.id,
            bookingId: booking.id,
            discountAmount: actualDiscountAmount,
            subsidyAmount
          });

          console.log(`Recorded promo code usage: ${promoCodeUsed.code}, discount: $${actualDiscountAmount/100}, subsidy: $${subsidyAmount/100}`);
        } catch (promoError) {
          console.error("Error recording promo code usage:", promoError);
        }
      }
      
      console.log("Booking created successfully:", booking);
      
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
            
            // Create scheduled payout record
            await storage.createScheduledPayout({
              bookingId: booking.id,
              classId: parseInt(classId),
              coachId: classItem.coachId,
              customerId: req.user.id,
              stripePaymentIntentId: paymentIntentId,
              amountCents: parseInt(metadata.amount || '0'),
              stripeFee: parseInt(metadata.stripeFee || '0'),
              netAmount: parseInt(metadata.netAmount || '0'),
              coachPayout: parseInt(metadata.coachPayout || '0'),
              platformFee: parseInt(metadata.platformFee || '0'),
              scheduledPayoutDate: payoutDate,
              status: 'scheduled'
            });
            
            console.log(`Scheduled payout created for coach ${classItem.coachId}, payout date: ${payoutDate.toISOString()}`);
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
                const emailSent = await sendBookingConfirmation({
                  booking: confirmedBooking,
                  classData: classDetails,
                  customer: req.user,
                  coach: coach
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
              }
            }
          }
        }
      } catch (emailError) {
        // Don't fail the booking if email fails
        console.error("Email sending error:", emailError);
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
          console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
          
          // Create confirmed booking directly (no pending status)
          if (paymentIntent.metadata && paymentIntent.metadata.classId && paymentIntent.metadata.userId) {
            // Check if booking already exists to avoid duplicates
            const existingBookings = await storage.getUserBookings(parseInt(paymentIntent.metadata.userId));
            const duplicate = existingBookings.find(b => 
              b.classId === parseInt(paymentIntent.metadata.classId) && 
              b.stripePaymentIntentId === paymentIntent.id
            );
            
            if (!duplicate) {
              await storage.createBooking({
                userId: parseInt(paymentIntent.metadata.userId),
                classId: parseInt(paymentIntent.metadata.classId),
                quantity: 1,
                status: "confirmed",
                stripePaymentIntentId: paymentIntent.id,
                paymentDate: new Date(),
                paymentMethod: "stripe"
              });
            }
          }
          break;
          
        case 'payment_intent.payment_failed':
          console.log(`Payment failed: ${event.data.object.id}`);
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
      const allowedFields = ['firstName', 'lastName', 'phone', 'bio', 'profileImage', 'areasOfExpertise', 'certifications'];
      const updateData: Record<string, any> = {};
      
      // Use explicit property assignment to avoid prototype pollution
      if ('firstName' in req.body) updateData.firstName = req.body.firstName;
      if ('lastName' in req.body) updateData.lastName = req.body.lastName;
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
        usageLimit: usageLimit || null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        platformSubsidized: platformSubsidized || false,
        commissionOverride: commissionOverride || null,
        budgetLimit: budgetLimit || null,
        createdBy: user.id
      };

      const promoCode = await storage.createPromoCode(promoCodeData);
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

      // Check permissions
      if (user.role !== 'admin' && 
          (user.role !== 'coach' || existingPromoCode.coachId !== user.id || existingPromoCode.isApproved)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData: any = {};
      const allowedFields = ['name', 'description', 'discountType', 'discountValue', 
                           'firstBookingOnly', 'usageLimit', 'validFrom', 'validUntil',
                           'platformSubsidized', 'commissionOverride', 'budgetLimit', 'isActive'];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
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

      res.json(approvedPromoCode);
    } catch (error: any) {
      console.error("Error approving promo code:", error);
      res.status(500).json({ message: "Failed to approve promo code" });
    }
  });

  // Delete promo code (admin only)
  app.delete("/api/promo-codes/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const promoCodeId = parseInt(req.params.id);
      const deleted = await storage.deletePromoCode(promoCodeId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Promo code not found" });
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
      const { code, classId } = req.body;
      
      if (!code || !classId) {
        return res.status(400).json({ message: "Code and class ID are required" });
      }

      const validation = await storage.validatePromoCode(code, req.user!.id, classId);
      
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

      const discountCalc = await storage.calculateDiscount(validation.promoCode!, classItem.price * 100);
      
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
        '/terms/customer-referrals'
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

  const httpServer = createServer(app);

  return httpServer;
}
