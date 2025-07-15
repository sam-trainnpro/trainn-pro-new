import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GiftTermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Gift Terms and Conditions</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>What are the terms and conditions for gifts?</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <h2 className="text-xl font-semibold mb-4">Trainn Gift Terms and Conditions</h2>
              
              <p className="text-sm text-gray-600 mb-6">
                Last updated: June 2, 2025
              </p>

              <p className="mb-6">
                The following terms and conditions (the "Gift Terms") apply to any Trainn gift membership (the "Gift"). Gifts purchased in the United States, are issued by Trainn, gifts purchased outside of the United States are issued by the relevant Trainn affiliate (referred to as "Trainn," we," "us" or "our"). By purchasing a Gift, accepting and retaining a Gift, or using a Gift, you agree to these terms and conditions. We reserve the right to change, amend or terminate these Gift Terms at any time without notice.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1. Gift Membership Subscription and Gift Class Requirements.</h3>
                  <p className="mb-4">
                    Trainn can offer a subscription membership that automatically renews each month until cancelled. A Gift may be used toward monthly membership subscription amount and mid-cycle purchases of Trainn credits (unless in Trainn's discretion, Trainn applies it to additional purchases you make in the future) in countries where Trainn subscriptions are offered. For avoidance of doubt, Gifts cannot be used toward late cancellation fees.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2. Shortages/Overages.</h3>
                  <p className="mb-4">
                    If the Gift amount is insufficient to cover the price of a full month of the Trainn membership the Recipient wishes to use (for example, if Recipient redeems for a membership at a higher price point than value of the Gift), then at the time of redemption, the Recipient must pay the difference by credit card or other payment method we may accept. If the Gift is for an amount that is greater than the monthly rate for the membership redeemed, the difference may be applied to future monthly charges for the membership.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3. Eligibility.</h3>
                  <p className="mb-4">
                    In order to redeem a Gift and sign up for a Trainn membership, Recipient must be at least 18 years old, agree to the Trainn Terms of Use and Privacy Policy, provide a valid payment method and have access to the Internet.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">4. Redemption:</h3>
                  <p className="mb-4">
                    Trainn will electronically deliver a redemption code to the e-mail address provided by the Gift purchaser. Unless communicated otherwise, after a Gift is purchased, the value of the Gift cannot be increased and the entire amount of the Gift must be redeemed at one time. Gift membership begins the day Recipient redeems the Gift. IN THE EVENT A GIFT CODE IS NON-FUNCTIONAL, YOUR SOLE REMEDY, AND OUR SOLE LIABILITY, WILL BE THE REPLACEMENT OF THAT GIFT CODE.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">5. Restrictions.</h3>
                  <p className="mb-4">
                    Resale of the Gift or use for unauthorized advertising, marketing, sweepstakes or other promotional or commercial purposes is strictly prohibited. Gifts may not be combined with other offers. Your right to use the Gift is limited, subject to the Gift Terms, the Trainn Terms of Use and applicable law. We are not responsible for pricing, typographical, or other errors and reserve the right to cancel any orders resulting from such errors. The Gift is not a credit card and has no implied warranties. The Gift cannot be returned or refunded except where required by law.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">6. No Expiration Date/Service Charges.</h3>
                  <p className="mb-4">
                    The Gift carries no expiration date, service charges or dormancy fees.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">7. Refunds/Replacements/Risk of Loss.</h3>
                  <p className="mb-4">
                    You must protect the Gift as if it were cash and safeguard the Gift from unauthorized use. Except in special circumstances or where required by law, Gifts are not refundable. Gift will not be refunded or replaced if lost, stolen, mutilated or damaged and may not be redeemed for cash, except where required by law. The risk of loss and title for Gifts pass to the purchaser upon our electronic transmission of the Gift to the purchaser or designated recipient.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">8. Misuse of the Card.</h3>
                  <p className="mb-4">
                    If we suspect any fraud or misuse in connection with a Gift, we reserve the right in our discretion to suspend or terminate use of the Gift. We may cancel the Gift at any time, without notice.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">9. General Terms.</h3>
                  <p className="mb-4">
                    The Trainn Terms of Use and Privacy Policy apply to Gifts and any disputes arising out of a Gift or the Gift Terms will be resolved in accordance with the Terms of Use. Trainn reserves the right to change the Gift Terms and Conditions any time in its sole discretion.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">10. Promotional Cards.</h3>
                  <p className="mb-4">
                    These terms and conditions do not apply to gift cards or other stored value cards that are given away free with a purchase, or distributed as a reward, incentive, or as part of a marketing, promotional or customer loyalty program ("Promotional Cards"), Promotional Cards may have expiration dates to the extent permitted by applicable law.
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