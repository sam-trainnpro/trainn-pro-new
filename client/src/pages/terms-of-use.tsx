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

              <p className="mb-6">
                Welcome to Trainn! These Terms of Use ("Terms") are a contract between you and Samuel Roth d/b/a Trainn if you are located in the United States or the applicable Trainn entity indicated in the Regional Amendment applicable to your location below ("Trainn" or "we") and govern your access to and use of any Trainn or any applicable third party website, mobile application (such as for iPhone or Android) or content (individually or collectively, the "Site") or any fitness, recreational or other classes, services, content, offerings, features, products, tools or programs available on or through the Site (collectively, "Offerings"). Through the use of the Site, you may be able to access certain Services (as defined below) and may also have the opportunity to use the Site to view and/or purchase products and/or services from Trainn and/or other third parties, including but not limited to Venues (as defined below).
              </p>

              <p className="mb-6">
                UNLESS PROVIDED OTHERWISE IN THE APPLICABLE REGIONAL AMENDMENT BELOW, THESE TERMS CONTAIN A BINDING ARBITRATION AGREEMENT AND CLASS ACTION WAIVER THAT REQUIRE YOU TO ARBITRATE ALL DISPUTES YOU HAVE WITH TRAINN RELEASEES ON AN INDIVIDUAL BASIS. PLEASE SEE SECTIONS 18 AND 19(J) FOR MORE INFORMATION ABOUT THE ARBITRATION AGREEMENT AND CLASS ACTION WAIVER. YOU EXPRESSLY AGREE THAT DISPUTES BETWEEN YOU AND TRAINN RELEASEES WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION. YOU HEREBY EXPRESSLY WAIVE YOUR RIGHT TO TRIAL BY JURY AND YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT. IF YOU DO NOT AGREE TO ARBITRATE DISPUTES AND WAIVE YOUR RIGHT TO TRIAL BY JURY AND CLASS ACTION PARTICIPATION, DO NOT USE THE SITE OR OFFERINGS.
              </p>

              <p className="mb-6">
                These terms are subject to any applicable region-specific amendments set forth at the end of this page in the section entitled "Regional Amendments". Please review that section for amendments applicable to your region. In the event of a conflict with these Terms, the Regional Amendment applicable to you will govern.
              </p>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">1. Terms of Use</h2>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">a) Acceptance of Terms.</h3>
                    <p className="mb-4">
                      By accessing and/or using the Site and/or Offerings, either through Trainn, your employer, or another third party; clicking any button to indicate your consent; or otherwise indicating your consent to these Terms, you accept and agree to be bound by these Terms and all terms, conditions, and limitations associated with them that are posted on the Site and the Trainn Privacy Policy, just as if you had agreed to these Terms in writing. If you do not agree to these Terms, you may not access or use the Site or Offerings. These Terms are effective as of the date you first use the Site or Offerings.
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
                      In addition to these Terms, certain plans, offers, products, services, elements or features may also be subject to additional terms, conditions, guidelines or rules which may be posted, communicated or modified by us or applicable third parties at any time. Your use of any such plan, offer, product, service, element or feature is subject to those additional terms and conditions, which are hereby incorporated by reference into the Terms, provided that in the event of a conflict, the Terms shall govern. Without limiting the generality of the foregoing, your use of any Third Party Service (as defined below) is subject to the applicable third party terms and conditions.
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
                      There are a number of ways to participate in Offerings such as various subscription plans, promotional plans, digital Offerings, and non-subscription purchases. These options consist of different Offerings, services and features and may be subject to additional and differing conditions, prices, policies and limitations. We reserve the right to modify, terminate or otherwise amend our offered options and plans at any time in our discretion. From time to time, Trainn may also run promotions or offer special deals to certain users. Some options may be available only to certain users or in certain geographic areas.
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
                      Train may provide various subscription plans to provide access to additional parts of the Site and additional Offerings. A subscription starts on the date that you sign up for a subscription and submit payment via a valid Payment Method (defined below) or reactivate a pre-existing subscription. Unless we communicate a different time period to you at the time of sign up or otherwise (such as a multi-month commitment plan): each billing cycle is one month in length and commences on the day that you sign up for a subscription or reactivate a pre-existing subscription and each subsequent month thereafter on the same day of the month (the "Subscription Cycle"). If your subscription renewal date falls on a day that does not occur in a particular month, your subscription will renew on the last day of that month.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">e) Credits, Credit Rollover, and Credit Expiration.</h3>
                    <p className="mb-4">
                      Depending on the Trial or subscription plan you choose, you will be allotted credits that you may use to book reservations for Offerings in each Trial or Subscription Cycle. You can choose how you use and allocate your credits across the various Offerings available to you. These credits can only be used for the limited purpose of booking eligible Offerings through the Site. Credits have no cash value or any other value outside of the Site and cannot be refunded, exchanged, sold, or otherwise transferred. Credits expire if not used within the applicable time period, which varies by subscription plan and will be communicated to you at the time of sign up or otherwise.
                    </p>
                    
                    <p className="mb-4">
                      If you have any questions about how to use your credits, please contact us and we can help you.
                    </p>
                    
                    <p className="mb-4">
                      Note that separate and independent from credits, you can buy a gift certificate. Gift certificates and credits are not the same thing. Our gift certificates are called "gift cards". Unlike credits, gift cards never expire. Gift cards are discussed further in Section 4(b) below.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">f) Offering Availability and Allocation.</h3>
                    <p className="mb-4">
                      The exact number and type of Offerings you can attend during any Subscription Cycle will depend on the number of credits needed to book the particular Offerings you select. The number of credits needed to book a particular Offering will vary and is determined based on a variety of factors, including but not limited to Venue requirements, time of day, equipment, facilities, the number of times you've visited a Venue in the cycle, location, class popularity, and instructor. Some Offerings may require additional fees beyond credits.
                    </p>
                    
                    <p className="mb-4">
                      Trainn does not guarantee the availability of particular Venues, locations, Offerings, services, experiences, content, inventory, spots or other features, and availability may change over time and at any time (including during the course of any given Subscription Cycle), nor does Trainn make guarantees regarding reservations or reservation processing time. Inventory may be more limited in certain locations and during Trials or promotions. The type, quantity, credits, allocation and availability of Offerings may change at any time. We may limit the number of reservations you can make in advance or the number of times you can visit a particular Venue.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">g) Co-Memberships.</h3>
                    <p className="mb-4">
                      From time to time Trainn may permit you to sign up for a co-membership that provides you with a membership to Trainn as well as a membership to a third-party Venue, such as a gym ("Venue Membership"). If you sign up for a co-membership, you will be subject to these Terms as well as additional terms applicable to the co-membership and the Venue Membership. You understand and agree that Trainn does not own, operate or control the Venue Membership and is not responsible for the Venue Membership or any aspects of your experience with the Venue Membership. You may be required to provide additional information to the third-party Venue and may be subject to additional terms and conditions.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">h) Trainn Account.</h3>
                    <p className="mb-4">
                      Your Trainn account is personal to you and you agree not to create more than one account. You cannot transfer or gift Offerings or credits to third parties or allow third parties to use your Trainn account, including other Trainn users unless Trainn explicitly communicates otherwise in a specific case. You must not use or exploit the Site and/or Offerings for commercial purposes. We continually update and test various aspects of the Trainn platform. We reserve the right to limit the number of accounts any individual may register and maintain. You must be at least 18 years of age to register for a Trainn account, unless you are a minor and have obtained your parent or guardian's consent.
                    </p>
                    
                    <p className="mb-4">
                      You agree that the information you provide to Trainn at sign up and at all other times will be true, accurate, current, and complete and that you will keep this information accurate and up-to-date at all times. When you sign up, you will be asked to create a password. You are solely responsible for all activity that occurs under your account, including any activity by unauthorized users. To use the Site you must have access to the Internet and may be required to download a Trainn application or other software. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
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