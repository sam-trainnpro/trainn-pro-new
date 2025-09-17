import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error('Server error:', err);
      
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
      // Start automated payout processing
      if (process.env.NODE_ENV === 'production') {
        // In production, process payouts every 4 hours
        setInterval(async () => {
          try {
            const { payoutProcessor } = await import('./payout-processor');
            const results = await payoutProcessor.processDuePayouts();
            if (results.length > 0) {
              console.log(`🎯 Processed ${results.length} scheduled payouts`);
            }
          } catch (error) {
            console.error('Error in automated payout processing:', error);
          }
        }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
        
        log('🕐 Automated payout processing started (every 4 hours)');
      } else {
        // In development, process payouts every 10 minutes for testing
        setInterval(async () => {
          try {
            const { payoutProcessor } = await import('./payout-processor');
            const results = await payoutProcessor.processDuePayouts();
            if (results.length > 0) {
              console.log(`🎯 [DEV] Processed ${results.length} scheduled payouts`);
            }
          } catch (error) {
            console.error('Error in automated payout processing:', error);
          }
        }, 10 * 60 * 1000); // 10 minutes in milliseconds
        
        log('🕐 [DEV] Automated payout processing started (every 10 minutes)');
      }

      // Start automated email reminder processing
      if (process.env.NODE_ENV === 'production') {
        // In production, send class reminders once daily at 9 AM PT
        const scheduleNextReminderCheck = () => {
          const now = new Date();
          const nextRun = new Date();
          nextRun.setHours(17, 0, 0, 0); // 9 AM PT = 5 PM UTC
          
          // If it's past 9 AM PT today, schedule for tomorrow
          if (now >= nextRun) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
          
          const msUntilNextRun = nextRun.getTime() - now.getTime();
          
          setTimeout(async () => {
            try {
              const { sendDailyClassReminders } = await import('./email-scheduler');
              await sendDailyClassReminders();
              console.log('📧 Daily class reminders completed');
              
              // Schedule the next run for 24 hours later
              setInterval(async () => {
                try {
                  await sendDailyClassReminders();
                  console.log('📧 Daily class reminders completed');
                } catch (error) {
                  console.error('Error in daily class reminder process:', error);
                }
              }, 24 * 60 * 60 * 1000); // 24 hours
              
            } catch (error) {
              console.error('Error in daily class reminder process:', error);
            }
          }, msUntilNextRun);
          
          log(`📧 Daily class reminder processing scheduled for ${nextRun.toLocaleString()}`);
        };
        
        scheduleNextReminderCheck();
      } else {
        // In development, send reminders every hour for testing
        setInterval(async () => {
          try {
            const { sendDailyClassReminders } = await import('./email-scheduler');
            await sendDailyClassReminders();
            console.log('📧 [DEV] Daily class reminders completed');
          } catch (error) {
            console.error('Error in daily class reminder process:', error);
          }
        }, 60 * 60 * 1000); // 1 hour in milliseconds
        
        log('📧 [DEV] Daily class reminder processing started (every hour)');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
