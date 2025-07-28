import { storage } from "./storage";
import Stripe from "stripe";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' })
  : null;

export interface PayoutResult {
  payoutId: number;
  success: boolean;
  error?: string;
  transferId?: string;
}

export class PayoutProcessor {
  /**
   * Process all scheduled payouts that are due
   */
  async processDuePayouts(): Promise<PayoutResult[]> {
    if (!stripe) {
      console.warn("Stripe not configured, skipping payout processing");
      return [];
    }

    try {
      const duePayouts = await storage.getDueScheduledPayouts();
      console.log(`Found ${duePayouts.length} due payouts to process`);

      const results: PayoutResult[] = [];

      for (const payout of duePayouts) {
        const result = await this.processIndividualPayout(payout);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error("Error processing due payouts:", error);
      return [];
    }
  }

  /**
   * Process an individual payout
   */
  private async processIndividualPayout(payout: any): Promise<PayoutResult> {
    try {
      // Update status to processing
      await storage.updateScheduledPayout(payout.id, { 
        status: 'processing' 
      });

      // Get coach details
      const coach = await storage.getUser(payout.coachId);
      if (!coach) {
        throw new Error(`Coach not found: ${payout.coachId}`);
      }

      // Check if coach has connected Stripe account
      if (!coach.stripeConnectId || !coach.stripeConnectOnboarded) {
        throw new Error(`Coach ${payout.coachId} does not have a connected Stripe account`);
      }

      // Get platform subsidy for this booking (if any)
      const platformSubsidy = await storage.getPlatformSubsidyForBooking(payout.bookingId);
      
      // Calculate total transfer amount (original coach payout + platform subsidy)
      const totalTransferAmount = payout.coachPayout + platformSubsidy;
      
      console.log(`=== PAYOUT CALCULATION ===`);
      console.log(`Coach base payout: $${(payout.coachPayout / 100).toFixed(2)}`);
      console.log(`Platform subsidy: $${(platformSubsidy / 100).toFixed(2)}`);
      console.log(`Total transfer amount: $${(totalTransferAmount / 100).toFixed(2)}`);

      // Create transfer to coach's connected account (including platform subsidy)
      const transfer = await stripe!.transfers.create({
        amount: totalTransferAmount,
        currency: 'usd',
        destination: coach.stripeConnectId,
        description: `Payout for class booking ${payout.bookingId}${platformSubsidy > 0 ? ' (includes platform subsidy)' : ''}`,
        metadata: {
          scheduledPayoutId: payout.id.toString(),
          bookingId: payout.bookingId.toString(),
          classId: payout.classId.toString(),
          coachId: payout.coachId.toString(),
          baseCoachPayout: payout.coachPayout.toString(),
          platformSubsidy: platformSubsidy.toString(),
          totalAmount: totalTransferAmount.toString()
        }
      });

      // Update payout as completed
      await storage.updateScheduledPayout(payout.id, {
        status: 'completed',
        stripeTransferId: transfer.id,
        completedAt: new Date()
      });

      if (platformSubsidy > 0) {
        console.log(`✅ Payout processed successfully: $${(payout.coachPayout / 100).toFixed(2)} base + $${(platformSubsidy / 100).toFixed(2)} subsidy = $${(totalTransferAmount / 100).toFixed(2)} total to coach ${payout.coachId}`);
      } else {
        console.log(`✅ Payout processed successfully: $${(payout.coachPayout / 100).toFixed(2)} to coach ${payout.coachId}`);
      }

      return {
        payoutId: payout.id,
        success: true,
        transferId: transfer.id
      };

    } catch (error: any) {
      console.error(`❌ Error processing payout ${payout.id}:`, error);

      // Update payout as failed
      await storage.updateScheduledPayout(payout.id, {
        status: 'failed',
        failureReason: error.message || 'Unknown error'
      });

      return {
        payoutId: payout.id,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payout statistics
   */
  async getPayoutStats(): Promise<{
    scheduled: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const scheduled = await storage.getScheduledPayouts({ status: 'scheduled' });
    const processing = await storage.getScheduledPayouts({ status: 'processing' });
    const completed = await storage.getScheduledPayouts({ status: 'completed' });
    const failed = await storage.getScheduledPayouts({ status: 'failed' });

    return {
      scheduled: scheduled.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  /**
   * Retry failed payouts
   */
  async retryFailedPayouts(): Promise<PayoutResult[]> {
    const failedPayouts = await storage.getScheduledPayouts({ status: 'failed' });
    const results: PayoutResult[] = [];

    for (const payout of failedPayouts) {
      // Reset status to scheduled for retry
      await storage.updateScheduledPayout(payout.id, {
        status: 'scheduled',
        failureReason: null
      });

      const result = await this.processIndividualPayout(payout);
      results.push(result);
    }

    return results;
  }
}

export const payoutProcessor = new PayoutProcessor();