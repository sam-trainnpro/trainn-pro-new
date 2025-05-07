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

  // Get all classes
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Get class by ID
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const classItem = await storage.getClass(classId);
      
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(classItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  // Create a new class (coaches only)
  app.post("/api/classes", requireCoach, async (req, res) => {
    try {
      const classData = req.body;
      classData.coachId = req.user.id;
      
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      res.status(500).json({ message: "Failed to create class" });
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

  // Get classes by coach ID
  app.get("/api/coaches/:id/classes", async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const classes = await storage.getClassesByCoach(coachId);
      res.json(classes);
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

  const httpServer = createServer(app);

  return httpServer;
}
