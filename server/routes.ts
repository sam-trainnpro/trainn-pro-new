import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { sendBookingConfirmation } from "./email";
import { z } from "zod";
import Stripe from "stripe";
import multer from "multer";
import path from "path";
import fs from "fs";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe if secret key is available
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" }) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
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

  const upload = multer({ 
    storage: storage_multer,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
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

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // Set up authentication routes
  setupAuth(app);

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
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Return the file path that can be used as the image URL
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "File upload failed" });
    }
  });

  // Create a new class (coaches only)
  app.post("/api/classes", requireCoach, async (req, res) => {
    try {
      // Initialize class data with user ID
      const classData: any = { 
        ...req.body, 
        coachId: req.user!.id 
      };
      
      const isRecurring = classData.isRecurring === true;
      
      // Define required fields based on class type
      const baseRequiredFields = ['title', 'description', 'categoryId', 'price', 'capacity', 'location', 'address'];
      const singleOccurrenceFields = [...baseRequiredFields, 'startTime', 'endTime'];
      const recurringFields = [...baseRequiredFields, 'schedules'];
      
      // Choose required fields based on class type
      const requiredFields = isRecurring ? recurringFields : singleOccurrenceFields;
      
      // Check for missing fields
      const missingFields = requiredFields.filter(field => {
        if (field === 'schedules') {
          return !classData.schedules || !Array.isArray(classData.schedules) || classData.schedules.length === 0;
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
        schedulesCount: classData.schedules?.length
      });
      
      // Create the class with properly formatted data
      const newClass = await storage.createClass(classData);
      
      // If this is a recurring class, create individual class instances for each scheduled day
      if (isRecurring && classData.schedules && classData.schedules.length > 0 && 
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

  // Delete class (coaches only)
  app.delete("/api/classes/:id", requireCoach, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Check if the class belongs to the coach
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (classItem.coachId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this class" });
      }
      
      await storage.deleteClass(classId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });
  
  // Update a class
  app.put("/api/classes/:id", requireCoach, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Check if the class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if the class belongs to the coach
      if (classItem.coachId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this class" });
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
      if (req.body.price) updateData.price = parseFloat(req.body.price);
      if (req.body.capacity) updateData.capacity = parseInt(req.body.capacity);
      if (req.body.location) updateData.location = String(req.body.location);
      if (req.body.address) updateData.address = String(req.body.address);
      if (req.body.image) updateData.image = String(req.body.image);
      
      // Handle date fields carefully
      if (req.body.startTime) {
        updateData.startTime = new Date(req.body.startTime);
      }
      if (req.body.endTime) {
        updateData.endTime = new Date(req.body.endTime);
      }

      // Update the class using storage method
      const updatedClass = await storage.updateClass(classId, updateData);
      
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found or update failed" });
      }
      
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  // Update a recurring class series (coaches only)
  app.put("/api/classes/:id/series", requireCoach, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      // Check if the class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if the class belongs to the coach
      if (classItem.coachId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this class series" });
      }
      
      // Verify this is actually a recurring class
      if (!classItem.isRecurring) {
        return res.status(400).json({ 
          message: "This is not a recurring class series. Use the regular update endpoint."
        });
      }
      
      // Update the entire series
      const updatedClasses = await storage.updateClassSeries(classId, req.body);
      
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

  // Book a class (authenticated users)
  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const { classId } = req.body;
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
        booking.status === "confirmed" || booking.status === "pending"
      );
      
      if (confirmedBookings.length >= classItem.capacity) {
        return res.status(400).json({ message: "Class is fully booked" });
      }
      
      // Create booking
      const booking = await storage.createBooking({
        userId,
        classId,
        status: "pending"
      });
      
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to book class" });
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
        booking.status === "confirmed" || booking.status === "pending"
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

  app.put("/api/admin/coaches/:id/approve", requireAdmin, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const coach = await storage.approveCoach(coachId);
      
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
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
      const { classId, amount, quantity = 1 } = req.body;
      
      if (!classId || !amount) {
        return res.status(400).json({ message: "Missing required parameters: classId, amount" });
      }
      
      // Check if user already has bookings for this class
      const userBookings = await storage.getUserBookings(req.user.id);
      const existingBookings = userBookings.filter(b => 
        b.classId === classId && 
        (b.status === "pending" || b.status === "confirmed")
      );
      
      // If no existing bookings, create a single pending booking with the requested quantity
      if (existingBookings.length === 0) {
        const bookingData = {
          userId: req.user.id,
          classId: classId,
          quantity: quantity,
          status: "pending",
          paymentMethod: "stripe"
        };
        await storage.createBooking(bookingData);
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
          // Convert amount to cents
          const amountInCents = Math.round(parseFloat(amount) * 100);
          
          // Calculate platform fee (15%) and coach payout (85%)
          const platformFee = Math.round(amountInCents * 0.15);
          const coachPayout = amountInCents - platformFee;
          
          // Create payment intent with Stripe Connect
          const paymentIntentData: any = {
            amount: amountInCents,
            currency: "usd",
            description: `Booking for ${classDetails.title}`,
            metadata: {
              classId: classId.toString(),
              userId: req.user.id.toString(),
              coachId: coach.id.toString(),
              platformFee: platformFee.toString(),
              coachPayout: coachPayout.toString()
            }
          };

          // If coach has connected Stripe account, use destination charges
          if (coach.stripeConnectId && coach.stripeConnectOnboarded) {
            paymentIntentData.transfer_data = {
              destination: coach.stripeConnectId
            };
            paymentIntentData.application_fee_amount = platformFee;
          }

          const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
          
          res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amountInCents,
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
        res.status(200).json({
          clientSecret: "dummy_client_secret_for_testing",
          paymentIntentId: `dummy_pi_${Date.now()}`,
          amount: parseFloat(amount) * 100,
          platformFee: Math.round(parseFloat(amount) * 100 * 0.15),
          coachPayout: Math.round(parseFloat(amount) * 100 * 0.85)
        });
      }
    } catch (error: any) {
      console.error("Payment creation error:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Confirm payment and update booking status
  app.post("/api/payment/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId, classId, quantity = 1 } = req.body;
      
      if (!paymentIntentId || !classId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Find all pending bookings for this user and class
      const userBookings = await storage.getUserBookings(req.user.id);
      console.log("User bookings:", userBookings);
      console.log("Looking for classId:", classId, "status: pending");
      
      const pendingBookings = userBookings.filter(b => 
        b.classId === parseInt(classId) && 
        b.status === "pending"
      );
      
      console.log("Found pending bookings:", pendingBookings.length);
      
      if (pendingBookings.length === 0) {
        return res.status(404).json({ 
          message: "No pending bookings found for this class",
          debug: { classId, userBookings: userBookings.length }
        });
      }
      
      // If we have multiple old-style bookings, update them all for now
      // But in the future, new bookings will be single records with quantity
      const updatedBookings = [];
      for (const booking of pendingBookings) {
        const updatedBooking = await storage.updateBooking(booking.id, {
          status: "confirmed",
          stripePaymentIntentId: paymentIntentId,
          paymentDate: new Date(),
          paymentMethod: "stripe"
        });
        updatedBookings.push(updatedBooking);
      }
      
      // Calculate total quantity from all bookings
      const totalQuantity = updatedBookings.reduce((sum, booking) => sum + (booking?.quantity || 1), 0);
      
      // Send confirmation email after successful booking
      try {
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
          
          // Update booking status to confirmed
          if (paymentIntent.metadata && paymentIntent.metadata.classId && paymentIntent.metadata.userId) {
            const bookings = await storage.getUserBookings(parseInt(paymentIntent.metadata.userId));
            const matchingBooking = bookings.find(b => 
              b.classId === parseInt(paymentIntent.metadata.classId) && 
              b.status === "pending"
            );
            
            if (matchingBooking) {
              await storage.updateBooking(matchingBooking.id, {
                status: "confirmed",
                stripePaymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                platformFee: parseInt(paymentIntent.metadata.platformFee),
                coachPayout: parseInt(paymentIntent.metadata.coachPayout),
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
  
  // Update user profile
  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own profile
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this user" });
      }
      
      // Get allowed fields based on the request body
      const allowedFields = ['firstName', 'lastName', 'bio', 'profileImage'];
      const updateData: Record<string, any> = {};
      
      // Use explicit property assignment to avoid prototype pollution
      if ('firstName' in req.body) updateData.firstName = req.body.firstName;
      if ('lastName' in req.body) updateData.lastName = req.body.lastName;
      if ('bio' in req.body) updateData.bio = req.body.bio;
      if ('profileImage' in req.body) updateData.profileImage = req.body.profileImage;
      
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
            product_description: 'Fitness coaching and training services',
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

  const httpServer = createServer(app);

  return httpServer;
}
