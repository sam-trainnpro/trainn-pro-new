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
      // First, process any pending referrer rewards
      console.log("=== PROCESSING REFERRER REWARDS ===");
      await storage.processReferrerRewards();

      // Process provider referral rewards
      console.log("=== PROCESSING PROVIDER REFERRAL REWARDS ===");
      await storage.processProviderReferralRewards();

      // Then process due payouts
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

      // Handle different payout types
      let platformSubsidy = 0;
      let totalTransferAmount;
      let description;
      let metadata: any;

      if (payout.payoutType === 'provider_referral_reward') {
        // Provider referral rewards don't need platform subsidy calculation
        totalTransferAmount = payout.coachPayout;
        description = `Provider referral reward - $25`;
        
        metadata = {
          scheduledPayoutId: payout.id.toString(),
          coachId: payout.coachId.toString(),
          payoutType: 'provider_referral_reward',
          providerReferralId: payout.providerReferralId?.toString() || 'unknown',
          amount: totalTransferAmount.toString()
        };
        
        console.log(`=== PROVIDER REFERRAL REWARD PAYOUT ===`);
        console.log(`Provider referral reward: $${(totalTransferAmount / 100).toFixed(2)}`);
        
      } else if (payout.payoutType === 'customer_referral_reward') {
        // Customer referral rewards for provider-to-customer referrals
        totalTransferAmount = payout.coachPayout;
        description = `Customer referral reward - $5`;
        
        metadata = {
          scheduledPayoutId: payout.id.toString(),
          coachId: payout.coachId.toString(),
          payoutType: 'customer_referral_reward',
          amount: totalTransferAmount.toString()
        };
        
        console.log(`=== CUSTOMER REFERRAL REWARD PAYOUT ===`);
        console.log(`Customer referral reward: $${(totalTransferAmount / 100).toFixed(2)}`);
        
      } else if (payout.payoutType === 'fully_subsidized_booking') {
        // Fully subsidized bookings - platform covers 100%
        totalTransferAmount = payout.coachPayout;
        description = `Fully subsidized payout for class booking ${payout.bookingId} (credit-only booking)`;
        
        metadata = {
          scheduledPayoutId: payout.id.toString(),
          bookingId: payout.bookingId.toString(),
          classId: payout.classId.toString(),
          coachId: payout.coachId.toString(),
          payoutType: 'fully_subsidized_booking',
          coachPayout: payout.coachPayout.toString(),
          totalAmount: totalTransferAmount.toString()
        };
        
        console.log(`=== FULLY SUBSIDIZED BOOKING PAYOUT ===`);
        console.log(`Credit-only booking payout: $${(totalTransferAmount / 100).toFixed(2)} (100% platform subsidized)`);
        
      } else if (payout.payoutType === 'promo_non_subsidized') {
        // Non-subsidized promo code - coach gets $0
        totalTransferAmount = 0;
        description = `Non-subsidized promo code booking ${payout.bookingId} - no payout`;
        
        metadata = {
          scheduledPayoutId: payout.id.toString(),
          bookingId: payout.bookingId.toString(),
          classId: payout.classId.toString(),
          coachId: payout.coachId.toString(),
          payoutType: 'promo_non_subsidized',
          coachPayout: '0',
          totalAmount: '0'
        };
        
        console.log(`=== NON-SUBSIDIZED PROMO CODE ===`);
        console.log(`Non-subsidized promo code - coach gets $0.00`);
        
      } else {
        // Regular booking payouts - get platform subsidy
        platformSubsidy = await storage.getPlatformSubsidyForBooking(payout.bookingId);
        totalTransferAmount = payout.coachPayout + platformSubsidy;
        description = `Payout for class booking ${payout.bookingId}${platformSubsidy > 0 ? ' (includes platform subsidy)' : ''}`;
        
        metadata = {
          scheduledPayoutId: payout.id.toString(),
          bookingId: payout.bookingId.toString(),
          classId: payout.classId.toString(),
          coachId: payout.coachId.toString(),
          baseCoachPayout: payout.coachPayout.toString(),
          platformSubsidy: platformSubsidy.toString(),
          totalAmount: totalTransferAmount.toString()
        };
        
        console.log(`=== BOOKING PAYOUT CALCULATION ===`);
        console.log(`Coach base payout: $${(payout.coachPayout / 100).toFixed(2)}`);
        console.log(`Platform subsidy: $${(platformSubsidy / 100).toFixed(2)}`);
        console.log(`Total transfer amount: $${(totalTransferAmount / 100).toFixed(2)}`);
      }

      // For $0 payouts, skip Stripe transfer and mark as completed
      if (totalTransferAmount === 0) {
        // Update payout as completed without Stripe transfer
        await storage.updateScheduledPayout(payout.id, {
          status: 'completed',
          stripeTransferId: null,
          completedAt: new Date()
        });
        
        console.log(`✅ $0 payout completed (no transfer needed) for coach ${payout.coachId}`);
        
        return {
          payoutId: payout.id,
          success: true,
          transferId: 'no_transfer_needed'
        };
      }

      // Create transfer to coach's connected account for amounts > $0
      const transfer = await stripe!.transfers.create({
        amount: totalTransferAmount,
        currency: 'usd',
        destination: coach.stripeConnectId,
        description: description,
        metadata: metadata
      });

      // Update payout as completed
      await storage.updateScheduledPayout(payout.id, {
        status: 'completed',
        stripeTransferId: transfer.id,
        completedAt: new Date()
      });

      if (payout.payoutType === 'provider_referral_reward') {
        console.log(`✅ Provider referral reward processed successfully: $${(totalTransferAmount / 100).toFixed(2)} to coach ${payout.coachId}`);
      } else if (payout.payoutType === 'fully_subsidized_booking') {
        console.log(`✅ Fully subsidized payout processed successfully: $${(totalTransferAmount / 100).toFixed(2)} to coach ${payout.coachId} (credit-only booking)`);
      } else if (platformSubsidy > 0) {
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