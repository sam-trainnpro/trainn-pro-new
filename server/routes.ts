import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe if secret key is available
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" }) : null;

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Update class (coaches only)
  app.put("/api/classes/:id", requireCoach, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const classData = req.body;
      
      // Check if the class belongs to the coach
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (classItem.coachId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this class" });
      }
      
      const updatedClass = await storage.updateClass(classId, classData);
      res.json(updatedClass);
    } catch (error) {
      res.status(500).json({ message: "Failed to update class" });
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
      
      // Update the class
      const updatedClass = await storage.updateClass(classId, req.body);
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
      
      // Get the class details for each booking
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const classItem = await storage.getClass(booking.classId);
          return {
            ...booking,
            class: classItem
          };
        })
      );
      
      res.json(bookingsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
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

  const httpServer = createServer(app);

  return httpServer;
}
