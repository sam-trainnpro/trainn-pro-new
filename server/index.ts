import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { addDays, format } from 'date-fns';

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
    const host = "0.0.0.0";
    
    server.on('error', (error: Error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
    
    server.listen(port, host, () => {
      log(`serving on port ${port}`);
      
      // Validate server is properly running
      if (!server.listening) {
        console.error('Server is not listening after startup');
        process.exit(1);
      }
      
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
          const timeZone = 'America/Los_Angeles';
          const now = new Date();
          
          // Get today's date string in Pacific timezone
          const nowInPT = toZonedTime(now, timeZone);
          const todayPTDateStr = formatInTimeZone(nowInPT, timeZone, 'yyyy-MM-dd');
          
          // Create today at 9:00 AM Pacific time using PT wall-time
          const today9AMPT = new Date(`${todayPTDateStr}T09:00:00`);
          const today9AMPTUTC = fromZonedTime(today9AMPT, timeZone);
          
          // If it's already past 9 AM PT today, schedule for tomorrow
          let next9AMPTUTC;
          if (now >= today9AMPTUTC) {
            const tomorrowInPT = addDays(nowInPT, 1);
            const tomorrowPTDateStr = formatInTimeZone(tomorrowInPT, timeZone, 'yyyy-MM-dd');
            const tomorrow9AMPT = new Date(`${tomorrowPTDateStr}T09:00:00`);
            next9AMPTUTC = fromZonedTime(tomorrow9AMPT, timeZone);
          } else {
            next9AMPTUTC = today9AMPTUTC;
          }
          const msUntilNextRun = next9AMPTUTC.getTime() - now.getTime();
          
          const executeReminders = async () => {
            try {
              const { sendDailyClassRemindersWithDatabaseIdempotency } = await import('./email-scheduler');
              await sendDailyClassRemindersWithDatabaseIdempotency();
              console.log('📧 Daily class reminders completed');
            } catch (error) {
              console.error('Error in daily class reminder process:', error);
            }
          };
          
          const scheduleNext = () => {
            // Compute the next 9 AM PT occurrence (tomorrow)
            const currentTime = new Date();
            const currentInPT = toZonedTime(currentTime, timeZone);
            const tomorrowInPT = addDays(currentInPT, 1);
            const tomorrowPTDateStr = formatInTimeZone(tomorrowInPT, timeZone, 'yyyy-MM-dd');
            const tomorrow9AMPT = new Date(`${tomorrowPTDateStr}T09:00:00`);
            const nextTargetUTC = fromZonedTime(tomorrow9AMPT, timeZone);
            const delay = nextTargetUTC.getTime() - currentTime.getTime();
            
            setTimeout(() => {
              executeReminders().finally(() => {
                // Schedule the next occurrence
                scheduleNext();
              });
            }, delay);
            
            log(`📧 Next daily reminder scheduled for ${format(nextTargetUTC, 'yyyy-MM-dd HH:mm:ss')} UTC (${tomorrowPTDateStr} 09:00:00 PT)`);
          };
          
          // Execute the first run
          setTimeout(() => {
            executeReminders().finally(() => {
              // Schedule subsequent runs
              scheduleNext();
            });
          }, msUntilNextRun);
          
          const next9AMPTDateStr = formatInTimeZone(next9AMPTUTC, timeZone, 'yyyy-MM-dd HH:mm:ss');
          log(`📧 First daily reminder scheduled for ${format(next9AMPTUTC, 'yyyy-MM-dd HH:mm:ss')} UTC (${next9AMPTDateStr} PT)`);
        };
        
        // First, perform catch-up if needed (if server restarts after 9 AM PT)
        const performCatchup = async () => {
          try {
            const { performStartupCatchupIfNeeded } = await import('./email-scheduler');
            const catchupPerformed = await performStartupCatchupIfNeeded();
            if (catchupPerformed) {
              console.log('🚀 Startup catch-up completed');
            }
          } catch (error) {
            console.error('Error in startup catch-up:', error);
          }
        };
        
        performCatchup().finally(() => {
          scheduleNextReminderCheck();
        });
      } else {
        // In development, send reminders every hour for testing (with idempotency)
        setInterval(async () => {
          try {
            const { sendDailyClassRemindersWithIdempotency } = await import('./email-scheduler');
            await sendDailyClassRemindersWithIdempotency();
            console.log('📧 [DEV] Daily class reminders completed');
          } catch (error) {
            console.error('Error in daily class reminder process:', error);
          }
        }, 60 * 60 * 1000); // 1 hour in milliseconds
        
        log('📧 [DEV] Daily class reminder processing started (every hour with idempotency)');
      }

      // Start automated post-class feedback email processing
      if (process.env.NODE_ENV === 'production') {
        // In production, check for completed classes every 15 minutes
        setInterval(async () => {
          try {
            const { sendPostClassFeedbackEmails } = await import('./email-scheduler');
            await sendPostClassFeedbackEmails();
            console.log('🎯 Post-class feedback emails completed');
          } catch (error) {
            console.error('Error in post-class feedback email process:', error);
          }
        }, 15 * 60 * 1000); // 15 minutes in milliseconds
        
        log('🎯 Automated post-class feedback email processing started (every 15 minutes)');
      } else {
        // In development, check for completed classes every 5 minutes for testing
        setInterval(async () => {
          try {
            const { sendPostClassFeedbackEmails } = await import('./email-scheduler');
            await sendPostClassFeedbackEmails();
            console.log('🎯 [DEV] Post-class feedback emails completed');
          } catch (error) {
            console.error('Error in post-class feedback email process:', error);
          }
        }, 5 * 60 * 1000); // 5 minutes in milliseconds
        
        log('🎯 [DEV] Automated post-class feedback email processing started (every 5 minutes)');
      }

      // Start automated weekly newsletter processing
      if (process.env.NODE_ENV === 'production') {
        // In production, check for weekly newsletter every Sunday at 2:00 PM PST
        const scheduleNextNewsletterCheck = () => {
          const timeZone = 'America/Los_Angeles';
          const now = new Date();
          const nowInPT = toZonedTime(now, timeZone);
          
          // Calculate next Sunday at 2:00 PM PT
          const nextSunday = new Date(nowInPT);
          const daysSinceLastSunday = nextSunday.getDay() || 7; // 0 becomes 7 for Sunday
          
          if (daysSinceLastSunday === 7 && nowInPT.getHours() < 14) {
            // It's Sunday before 2 PM, schedule for today
            nextSunday.setHours(14, 0, 0, 0);
          } else {
            // Schedule for next Sunday
            nextSunday.setDate(nextSunday.getDate() + (7 - daysSinceLastSunday));
            nextSunday.setHours(14, 0, 0, 0); // 2:00 PM PT
          }
          
          const nextSundayUTC = fromZonedTime(nextSunday, timeZone);
          const msUntilNextRun = nextSundayUTC.getTime() - now.getTime();
          
          const executeNewsletter = async () => {
            try {
              const { sendWeeklyNewslettersWithIdempotency } = await import('./email-scheduler');
              await sendWeeklyNewslettersWithIdempotency();
              console.log('📰 Weekly newsletter completed');
            } catch (error) {
              console.error('Error in weekly newsletter process:', error);
            }
          };
          
          // Schedule next newsletter
          setTimeout(() => {
            executeNewsletter().finally(() => {
              // Schedule the next occurrence (next Sunday)
              scheduleNextNewsletterCheck();
            });
          }, msUntilNextRun);
          
          const nextSundayPTStr = formatInTimeZone(nextSundayUTC, timeZone, 'yyyy-MM-dd HH:mm:ss');
          log(`📰 Next weekly newsletter scheduled for ${format(nextSundayUTC, 'yyyy-MM-dd HH:mm:ss')} UTC (${nextSundayPTStr} PT)`);
        };
        
        // First, perform catch-up if needed (if it's Sunday after 2 PM PT)
        const performNewsletterCatchup = async () => {
          try {
            const { performWeeklyNewsletterCatchupIfNeeded } = await import('./email-scheduler');
            const catchupPerformed = await performWeeklyNewsletterCatchupIfNeeded();
            if (catchupPerformed) {
              console.log('🚀 Weekly newsletter startup catch-up completed');
            }
          } catch (error) {
            console.error('Error in weekly newsletter catch-up:', error);
          }
        };
        
        performNewsletterCatchup().finally(() => {
          scheduleNextNewsletterCheck();
        });
      } else {
        // In development, check for weekly newsletter every hour for testing
        setInterval(async () => {
          try {
            const { shouldSendWeeklyNewsletter, sendWeeklyNewslettersWithIdempotency } = await import('./email-scheduler');
            
            // Only send if it's Sunday after 2 PM PT (for testing)
            if (shouldSendWeeklyNewsletter()) {
              await sendWeeklyNewslettersWithIdempotency();
              console.log('📰 [DEV] Weekly newsletter completed');
            }
          } catch (error) {
            console.error('Error in weekly newsletter process:', error);
          }
        }, 60 * 60 * 1000); // 1 hour in milliseconds
        
        log('📰 [DEV] Weekly newsletter processing started (checking every hour on Sunday afternoons)');
      }
    });
  } catch (error) {
    console.error('Failed to initialize server application:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
})().catch(error => {
  console.error('Unhandled error during server startup:', error);
  process.exit(1);
});
