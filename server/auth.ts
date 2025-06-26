import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "elevate-fitness-marketplace-secret";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.NODE_ENV === 'production' && process.env.REPL_DEPLOYMENT_URL
            ? `${process.env.REPL_DEPLOYMENT_URL}/api/auth/google/callback`
            : `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/google/callback`,
          scope: ['profile', 'email'],
          proxy: true
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }

            const firstName = profile.name?.givenName || "";
            const lastName = profile.name?.familyName || "";
            const googleProfilePicture = profile.photos?.[0]?.value || null;

            // Check if user exists with this email
            let user = await storage.getUserByEmail(email);

            if (user) {
              // Update existing user with Google info
              user = await storage.updateUser(user.id, {
                googleId: profile.id,
                authMethod: user.password ? "both" : "google",
                googleProfilePicture,
              });
            } else {
              // Create new user with Google info
              user = await storage.createUser({
                email,
                firstName,
                lastName,
                googleId: profile.id,
                authMethod: "google",
                googleProfilePicture,
                role: "customer", // Default to customer, can be changed later
              });

              // Send welcome email for new users
              try {
                const { sendWelcomeEmail } = await import('./email');
                await sendWelcomeEmail(user);
              } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
              }
            }

            done(null, user);
          } catch (error) {
            done(error);
          }
        }
      )
    );
  }

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create the user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
      });

      // Send welcome email
      try {
        const { sendWelcomeEmail } = await import('./email');
        await sendWelcomeEmail(user);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      // Remove password from the response
      const { password: _, ...userWithoutPassword } = user;

      // Log the user in automatically
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove password from the response
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from the response
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
