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

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">e) Credits, Credit Rollover, and Credit Expiration.</h3>
                    <p className="mb-4">
                      Depending on the Trial or subscription plan you choose, you will be allotted credits that you may use to book reservations for Offerings in each Trial or Subscription Cycle. You can choose how you use and allocate your credits across the various Offerings available to you. These credits can only be used for the limited purpose of booking eligible Offerings through the Site. Credits have no cash value or any other value outside of the Site, are not transferable or refundable, and are not redeemable for cash. Even on the Site, Credits do not have a cash value or set value. They do not operate or serve as stored value facilities in any way. You may not sell, transfer, trade, gift, or otherwise exchange Trainn credits. Credits for any reservations you make will be automatically deducted from the number of credits you have remaining in your account. Credits are deducted from your account in the cycle in which the Offering takes place, not the cycle in which you reserved the Offering. You can see in your Trainn account how many credits and days you have left for your current Trial or Subscription Cycle. When your cycle automatically renews, you'll automatically receive your new allotment of Credits. Credits expire at the end of each Trial and Subscription Cycle, meaning that any credits you don't use during the applicable Trial or Subscription Cycle will not roll over into future months, unless expressly provided in the credit rollover policy or we expressly communicate otherwise in writing. Credits that do not roll over expire. You can find more information about the current rollover policies here. If your subscription is canceled or terminated your unused credits will expire immediately except as stated in our rollover policy or otherwise in writing. There will be no refund or payment for any unused amount. If you have any questions about how to use your credits, please contact us and we can help you.
                    </p>
                    
                    <p className="mb-4">
                      Note that separate and independent from credits, you can buy a gift certificate. Gift certificates and credits are not the same thing. Our gift certificates are called "gift cards". Unlike credits, gift cards never expire. Gift cards are discussed further in Section 4(b) below.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">f) Offering Availability and Allocation.</h3>
                    <p className="mb-4">
                      The exact number and type of Offerings you can attend during any Subscription Cycle will depend on the number of credits needed to book the particular Offerings you select. The number of credits needed to book a particular Offering will vary and is determined based on a variety of factors, including but not limited to Venue requirements, time of day, equipment, facilities, the number of times you've visited a Venue in the cycle, location, pricing, popularity and other characteristics. For example, an Offering offered at a peak time is likely to require more credits to book than the same Offering offered in the middle of the afternoon. Or, an Offering that uses equipment is likely to require more credits to book than an Offering without the use of any equipment. Furthermore, a Venue may require more credits for a certain Offering under certain circumstances, such as when the Venue makes only a small number of spots available to Trainn or after multiple visits in a cycle. Note that credits needed to book Offerings also vary from city to city. Accordingly, if Trainn permits you to reserve Offerings in a city that differs from your home location, your credits may enable you to reserve more or fewer Offerings when you are traveling from your home location. As such, the number of credits you need to reserve a particular Offering or service may change at any time or vary day to day depending on the factors described here. Trainn also reserves the right to change the number of credits you receive, including per cycle, plan, geography or otherwise; the number of reservations you can make; and/or the number of Offerings you can miss or cancel.
                    </p>
                    
                    <p className="mb-4">
                      Trainn does not guarantee the availability of particular Venues, locations, Offerings, services, experiences, content, inventory, spots or other features, and availability may change over time and at any time (including during the course of any given Subscription Cycle), nor does Trainn make guarantees regarding reservations or reservation processing time. Inventory may be more limited in certain locations and during Trials or promotions. The type, quantity, credits, allocation and availability of Venues, Offerings, and other inventory offered, are determined by Trainn in its sole discretion. Trainn takes certain steps to release, promote and otherwise make available spots and inventory at varying times and in an ongoing and evolving way. User experience, such as content, inventory, credits, and reservations, may differ from user to user and by user at any time based on a variety of factors such as individual usage of the platform and participation in Offerings. For example, certain reservation patterns such as frequent cancels might result in additional processing time of certain future reservations or restricted inventory access.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">g) Co-Memberships.</h3>
                    <p className="mb-4">
                      From time to time Trainn may permit you to sign up for a co-membership that provides you with a membership to Trainn as well as a membership to a third-party Venue, such as a gym ("Venue Membership"). If you sign up for a co-membership, you will be subject to these Terms as well as additional terms applicable to the co-membership and the Venue Membership. You understand and agree that Trainn does not own, operate or control the Venue Membership and is not responsible for the Venue Membership, which is provided entirely by the applicable Venue.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">h) Trainn Account.</h3>
                    <p className="mb-4">
                      Your Trainn account is personal to you and you agree not to create more than one account. You cannot transfer or gift Offerings or credits to third parties or allow third parties to use your Trainn account, including other Trainn users unless Trainn explicitly communicates otherwise in a specific case. You must not use or exploit the Site and/or Offerings for commercial purposes. We continually update and test various aspects of the Trainn platform. We reserve the right to, and by using the Site and/or Offerings you agree that we may, include you in or exclude you from these tests without notice. You understand and agree that Trainn may take actions we deem reasonably necessary to prevent fraud and abuse.
                    </p>
                    
                    <p className="mb-4">
                      You agree that the information you provide to Trainn at sign up and at all other times will be true, accurate, current, and complete and that you will keep this information accurate and up-to-date at all times. When you sign up, you will be asked to create a password. You are solely responsible for all activity that occurs under your account, including any activity by unauthorized users. To use the Site you must have access to the Internet and may be required to download a Trainn mobile application to use some or all of Trainn features. You are solely responsible for providing your own access (e.g., computer, mobile device, Internet connection, etc.) to the Site and Offerings.
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