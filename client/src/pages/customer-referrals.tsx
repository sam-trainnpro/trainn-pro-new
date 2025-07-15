import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerReferralsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Customer Referral Terms and Conditions</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Trainn Customer Referral Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last updated: June 2, 2025
              </p>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Referral Process:</h2>
                  <p className="mb-4">
                    Existing, Trainn customers can refer eligible friends and contacts (each, a "Friend") to pay for offerings or classes or to subscribe to eligible Trainn subscriptions (an eligible subscription includes any plan available for purchase on Trainn's platform) (a "Trainn Subscription") by logging into their account on trainn.pro or in-app and undertaking one of three steps: (1) Referrer completes an online form entering the names and e-mail addresses of those Friends they want to refer; (2) Referrer emails, texts, or shares via social media a special referral link to Friends; or (3) Referrer provides a unique referral code to Friends (each, a "Referral Link").
                  </p>
                  
                  <p className="mb-4">
                    For each Friend who signs up for Trainn through a Referrer's valid Referral Link and subsequently becomes a paying Trainn customer or subscriber, the Referrer will either receive a one-time monetary discount to Referrer's subscription fee ("Subscription Discount") or a Trainn credit ("Trainn Credit") in Referrer's account. If the Referrer receives a discount to their subscription fee, this will appear in the Referrer's next subscription month beginning after the Friend becomes a paid subscriber (a "Reward").
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Referrers:</h2>
                  <p className="mb-4">
                    To qualify, Referrers must be current Trainn customers or subscribers in good standing. Referrals may only be made through the Referrers unique Referral Link.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Friends:</h2>
                  <p className="mb-4">
                    Rewards will only be awarded for referrals of Friends that are new to Trainn (in other words, Friends cannot already have an active or inactive Trainn account), are at least 18 years old, otherwise qualify to be a Trainn subscriber, purchase a Trainn Subscription directly through the Referral Link by any applicable offer end date, become a paid subscriber at the end of any free trial period, and have provided you with clear and affirmative consent to receive marketing materials and other messages containing the Referral Link from you by SMS text, WhatsApp, email, social media, and all other methods.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Conditions:</h2>
                  <p className="mb-4">
                    In addition to the other terms and conditions provided herein, purchasers of Trainn products or services other than a Trainn Subscription or Trainn class offering are not eligible to receive a Reward. Trainn will only honor the first Referral Link through which a Friend purchases a Trainn Subscription and which is accepted and processed by Trainn. In other words, if multiple Referrers have referred the same Friend and the Friend has activated multiple referral links or invitations, only the first Referrer will be eligible to receive a Reward.
                  </p>
                  
                  <p className="mb-4">
                    It is a condition of this promotion that you have obtained the clear and affirmative consent of your Friend(s) to receive marketing materials and other messages containing the Referral Link from you by SMS text, WhatsApp, email, social media, and all other methods.
                  </p>
                  
                  <p className="mb-4">
                    Washington state residents are excluded from the Refer-a-Friend Program. No Subscription Discount or Trainn Credit shall be awarded with respect to Friends resident in Washington state. You shall be disqualified from participation in the Refer-a-Friend Program if you undertake any of the steps set out at "Referral Process" above with respect to a resident of Washington state.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Subscription Discount:</h2>
                  <p className="mb-4">
                    Subscription Discounts can only be applied toward Referrer's monthly membership subscription amount and mid-cycle purchases of Trainn credits (unless in its discretion, Trainn applies it to additional purchases you make in the future) in countries where Trainn subscriptions are offered. For the avoidance of doubt, Subscription Discounts cannot be used toward late cancellation/missed class fees. For Gift Card Terms and Conditions, see <a href="/terms/gifts" className="text-blue-600 hover:underline">here</a>.
                  </p>
                  
                  <p className="mb-4">
                    Trainn Credits are pooled with the other Trainn credits purchased by you in your account and are collectively subject to Trainn's standard credit rollover policy.
                  </p>
                  
                  <p className="mb-4">
                    Eligible individuals will receive the Subscription Discount amount advertised on trainn.pro or the Trainn app; Trainn Credit amounts may vary by city/metro area and are subject to change at any time without notice.
                  </p>
                  
                  <p className="mb-4">
                    Rewards may not be (i) combined with other offers, discounts, referrals, or gift cards; (ii) sold or transferred; or (iii) redeemed for cash. This applies even if your membership is canceled before your next subscription month and therefore before any Reward has been applied. The maximum Subscription Discount that can be applied in each month is equal to the amount you would have paid for your subscription month if the Subscription Discount were not applied. For example, if the Referrer's subscription is $200/month and the Subscription Discount is $300, only $200 will be applied in the first month, and the remaining $100 will be applied in the second month.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Refer-A-Friend Program Promotions:</h2>
                  <p className="mb-4">
                    From time to time, Trainn may offer special promotions within its Refer-A-Friend Program ("Promotions") through which Referrers or Friends may receive a more generous Reward amount by complying with the terms and conditions of such Promotions. Each Promotion will last for a limited time, and each Referrer/Friend may only receive the more generous Credit amount or reward once during any such promotional period. All restrictions stated herein would apply in such cases. Trainn reserves the right to modify or terminate any Promotion at any time without notice.
                  </p>
                  
                  <p className="mb-4">
                    For specific Promotions, Friends must sign up during the offer period and become a Trainn subscriber for at least 10 days afterward. Your total Reward will be sent to your email or applied to your account by the end of the 6th week after the Promotion end date provided that, by such end date, the Friend has been a Trainn subscriber for at least 10 days.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">General:</h2>
                  <p className="mb-4">
                    The Trainn Terms of Service and Privacy Policy apply to the Refer-a-Friend Program, referrals, and Rewards and any disputes arising therefrom will be resolved in accordance with the Terms of Service. Referrers and Friends must comply with Trainn Terms of Use, the terms and conditions of any social media site where a Referral Link or Invitation is posted/used, and all applicable laws and regulations. Referral Links and Invitations are for individual, personal use only and may not be used for commercial purposes or posted on deal sites or forums.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  );
}