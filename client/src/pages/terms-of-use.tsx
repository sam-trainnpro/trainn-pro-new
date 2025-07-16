import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfUsePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Terms of Use</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Terms of Use</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last Updated: June 2, 2025
              </p>

              <div className="space-y-6">
                <p className="mb-6">
                  Welcome to Trainn! These Terms of Use ("Terms") are a contract between you and Samuel Roth d/b/a Trainn if you are located in the United States or the applicable Trainn entity indicated in the Regional Amendment applicable to your location below ("Trainn" or "we") and govern your access to and use of any Trainn or any applicable third party website, mobile application (such as for iPhone or Android) or content (individually or collectively, the "Site") or any fitness, recreational, wellness, or other offerings, experiences, activities, events, services, recordings, and/or products made available through Trainn or applicable third parties or their platforms (collectively, "Offerings"). Please read these Terms carefully before accessing and/or using the Site and/or Offerings.
                </p>

                <p className="mb-6">
                  UNLESS PROVIDED OTHERWISE IN THE APPLICABLE REGIONAL AMENDMENT BELOW, THESE TERMS CONTAIN A BINDING ARBITRATION AGREEMENT AND CLASS ACTION WAIVER THAT REQUIRE YOU TO ARBITRATE ALL DISPUTES YOU HAVE WITH TRAINN RELEASEES ON AN INDIVIDUAL BASIS. PLEASE SEE SECTIONS 18 AND 19(J) FOR MORE INFORMATION ABOUT THE ARBITRATION AGREEMENT AND CLASS ACTION WAIVER. YOU EXPRESSLY AGREE THAT DISPUTES BETWEEN YOU AND TRAINN RELEASEES WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION. YOU HEREBY WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS WIDE ARBITRATION.
                </p>

                <p className="mb-6">
                  These terms are subject to any applicable region-specific amendments set forth at the end of this page in the section entitled "Regional Amendments". Please review that section for amendments applicable to your region. In the event of a conflict with these Terms, the Regional Amendment applicable to you will govern.
                </p>

                <div>
                  <h2 className="text-xl font-semibold mb-4">1. Terms of Use</h2>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">a) Acceptance of Terms.</h3>
                    <p className="mb-4">
                      By accessing and/or using the Site and/or Offerings, either through Trainn, your employer, or another third party; clicking any button to indicate your consent; or otherwise indicating your consent to these Terms, you accept and agree to be bound by these Terms and all terms, conditions, and limitations associated with them that are posted on the Site and the Trainn Privacy Policy, just as if you had agreed to these Terms in writing. If you do not agree to these Terms, do not use the Site or any Offerings.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">b) Amendment of Terms.</h3>
                    <p className="mb-4">
                      Trainn may amend the Terms from time to time. Unless we provide a delayed effective date, all amendments will be effective upon posting of such updated Terms. Your continued access to or use of the Site or Offerings after such posting constitutes your consent to be bound by the Terms, as amended.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">c) Additional Terms.</h3>
                    <p className="mb-4">
                      In addition to these Terms, certain plans, offers, products, services, elements or features may also be subject to additional terms, conditions, guidelines or rules which may be posted, communicated or modified by us or applicable third parties at any time. Your use of any such plan, offer, product, service, element or feature is subject to those additional terms and conditions, which are hereby incorporated by reference into the Terms, provided that in the event of any conflict between such additional terms and the Terms, the Terms shall control. The Trainn Privacy Policy is hereby incorporated by reference.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">2. Trainn Platform</h2>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">a) Trainn Platform.</h3>
                    <p className="mb-4">
                      The Trainn platform enables consumers to reserve, schedule, purchase, access and attend a wide range of Offerings offered and operated by fitness studios, gyms, trainers, venues or other third parties (collectively, "Venues"). Trainn itself is not a gymnasium, place of amusement or recreation, health club, facility, fitness studio or similar establishment and does not own, operate or control any of the Offerings that are offered at or through such facilities.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">b) Membership Options.</h3>
                    <p className="mb-4">
                      There are a number of ways to participate in Offerings such as various subscription plans, promotional plans, digital Offerings, and non-subscription purchases. These options consist of different Offerings, services and features and may be subject to additional and differing conditions, prices, policies and limitations. We reserve the right to modify, terminate or otherwise amend our offered options and plans at any time in our discretion. From time to time we may permit non-subscribers to access certain Offerings, content or features for a cost or at no cost. Trainn makes no commitment on the quantity, availability, type or frequency at which such Offerings, content and features will be available to non-subscribers and may modify, discontinue, remove or suspend access at any time and for any reason in our sole discretion.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">c) Non-Subscription Purchases.</h3>
                    <p className="mb-4">
                      Trainn may permit you to purchase certain products or Offerings through the Site, without having a subscription or in addition to your subscription. You acknowledge and agree that these Terms apply to any such purchase you make, and you will be responsible to pay the applicable fees, which may change at any time.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">d) Subscription Plans.</h3>
                    <p className="mb-4">
                      Train may provide various subscription plans to provide access to additional parts of the Site and additional Offerings. A subscription starts on the date that you sign up for a subscription and submit payment via a valid Payment Method (defined below) or reactivate a pre-existing subscription. Unless we communicate a different time period to you at the time of sign up or otherwise (such as a multi-month commitment plan): each billing cycle is one month in length (a "Subscription Cycle"), your Trainn subscription automatically renews each month, and we will automatically bill the monthly subscription fee to your Payment Method each month, until your subscription is cancelled or terminated. For example, if you purchase your Trainn subscription on July 5, your subscription will automatically renew on August 5th (as further explained below). You must provide us with a current, valid, accepted method of payment to which any applicable fees will be charged ("Payment Method"). We may update the accepted methods from time to time. If you add a subscription to your base subscription or if you upgrade or downgrade to a different subscription, all such subscriptions will be governed by these Terms and will continue indefinitely until cancelled or terminated.
                    </p>
                  </div>
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