import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Trainn Terms of Use</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                Last Updated: June 2, 2025
              </p>

              <p className="mb-6">
                Welcome to Trainn! These Terms of Use ("Terms") are a contract between you and Samuel Roth d/b/a Trainn if you are located in the United States or the applicable Trainn entity indicated in the Regional Amendment applicable to your location below ("Trainn" or "we") and govern your access to and use of any Trainn or any applicable third party website, mobile application (such as for iPhone or Android) or content (individually or collectively, the "Site") or any fitness, recreational, wellness, or other offerings, experiences, activities, events, services, recordings, and/or products made available through Trainn or applicable third parties or their platforms (collectively, "Offerings"). Please read these Terms carefully before accessing and/or using the Site and/or Offerings.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <p className="text-sm font-medium">
                  <strong>IMPORTANT NOTICE:</strong> UNLESS PROVIDED OTHERWISE IN THE APPLICABLE REGIONAL AMENDMENT BELOW, THESE TERMS CONTAIN A BINDING ARBITRATION AGREEMENT AND CLASS ACTION WAIVER THAT REQUIRE YOU TO ARBITRATE ALL DISPUTES YOU HAVE WITH TRAINN RELEASEES ON AN INDIVIDUAL BASIS. PLEASE SEE SECTIONS 18 AND 19(J) FOR MORE INFORMATION ABOUT THE ARBITRATION AGREEMENT AND CLASS ACTION WAIVER. YOU EXPRESSLY AGREE THAT DISPUTES BETWEEN YOU AND TRAINN RELEASEES WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION. YOU HEREBY WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS WIDE ARBITRATION.
                </p>
              </div>

              <p className="mb-6">
                These terms are subject to any applicable region-specific amendments set forth at the end of this page in the section entitled "Regional Amendments". Please review that section for amendments applicable to your region. In the event of a conflict with these Terms, the Regional Amendment applicable to you will govern.
              </p>

              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-semibold mb-4">1. Terms of Use</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">a) Acceptance of Terms</h3>
                      <p>
                        By accessing and/or using the Site and/or Offerings, either through Trainn, your employer, or another third party; clicking any button to indicate your consent; or otherwise indicating your consent to these Terms, you accept and agree to be bound by these Terms and all terms, conditions, and limitations associated with them that are posted on the Site and the Trainn Privacy Policy, just as if you had agreed to these Terms in writing. If you do not agree to these Terms, do not use the Site or any Offerings.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">b) Amendment of Terms</h3>
                      <p>
                        Trainn may amend the Terms from time to time. Unless we provide a delayed effective date, all amendments will be effective upon posting of such updated Terms. Your continued access to or use of the Site or Offerings after such posting constitutes your consent to be bound by the Terms, as amended.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">c) Additional Terms</h3>
                      <p>
                        In addition to these Terms, certain plans, offers, products, services, elements or features may also be subject to additional terms, conditions, guidelines or rules which may be posted, communicated or modified by us or applicable third parties at any time. Your use of any such plan, offer, product, service, element or feature is subject to those additional terms and conditions, which are hereby incorporated by reference into the Terms, provided that in the event of any conflict between such additional terms and the Terms, the Terms shall control. The Trainn Privacy Policy is hereby incorporated by reference.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">2. Trainn Platform</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">a) Trainn Platform</h3>
                      <p>
                        The Trainn platform enables consumers to reserve, schedule, purchase, access and attend a wide range of Offerings offered and operated by fitness studios, gyms, trainers, venues or other third parties (collectively, "Venues"). Trainn itself is not a gymnasium, place of amusement or recreation, health club, facility, fitness studio or similar establishment and does not own, operate or control any of the Offerings that are offered at or through such facilities.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">b) Membership Options</h3>
                      <p>
                        There are a number of ways to participate in Offerings such as various subscription plans, promotional plans, digital Offerings, and non-subscription purchases. These options consist of different Offerings, services and features and may be subject to additional and differing conditions, prices, policies and limitations. We reserve the right to modify, terminate or otherwise amend our offered options and plans at any time in our discretion. From time to time we may permit non-subscribers to access certain Offerings, content or features for a cost or at no cost. Trainn makes no commitment on the quantity, availability, type or frequency at which such Offerings, content and features will be available to non-subscribers and may modify, discontinue, remove or suspend access at any time and for any reason in our sole discretion.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">c) Non-Subscription Purchases</h3>
                      <p>
                        Trainn may permit you to purchase certain products or Offerings through the Site, without having a subscription or in addition to your subscription. You acknowledge and agree that these Terms apply to any such purchase you make, and you will be responsible to pay the applicable fees, which may change at any time.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">d) Subscription Plans</h3>
                      <p>
                        Train may provide various subscription plans to provide access to additional parts of the Site and additional Offerings. A subscription starts on the date that you sign up for a subscription and submit payment via a valid Payment Method (defined below) or reactivate a pre-existing subscription. Unless we communicate a different time period to you at the time of sign up or otherwise (such as a multi-month commitment plan): each billing cycle is one month in length (a "Subscription Cycle"), your Trainn subscription automatically renews each month, and we will automatically bill the monthly subscription fee to your Payment Method each month, until your subscription is cancelled or terminated. For example, if you purchase your Trainn subscription on July 5, your subscription will automatically renew on August 5th (as further explained below). You must provide us with a current, valid, accepted method of payment to which any applicable fees will be charged ("Payment Method"). We may update the accepted methods from time to time. If you add a subscription to your base subscription or if you upgrade or downgrade to a different subscription, all such subscriptions will be governed by these Terms and will continue indefinitely until cancelled or terminated.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">e) Credits, Credit Rollover, and Credit Expiration</h3>
                      <p>
                        Depending on the Trial or subscription plan you choose, you will be allotted credits that you may use to book reservations for Offerings in each Trial or Subscription Cycle. You can choose how you use and allocate your credits across the various Offerings available to you. These credits can only be used for the limited purpose of booking eligible Offerings through the Site. Credits have no cash value or any other value outside of the Site, are not transferable or refundable, and are not redeemable for cash. Even on the Site, Credits do not have a cash value or set value. They do not operate or serve as stored value facilities in any way. You may not sell, transfer, trade, gift, or otherwise exchange Trainn credits. Credits for any reservations you make will be automatically deducted from the number of credits you have remaining in your account. Credits are deducted from your account in the cycle in which the Offering takes place, not the cycle in which you reserved the Offering. You can see in your Trainn account how many credits and days you have left for your current Trial or Subscription Cycle. When your cycle automatically renews, you'll automatically receive your new allotment of Credits. Credits expire at the end of each Trial and Subscription Cycle, meaning that any credits you don't use during the applicable Trial or Subscription Cycle will not roll over into future months, unless expressly provided in the credit rollover policy or we expressly communicate otherwise in writing. Credits that do not roll over expire. You can find more information about the current rollover policies here. If your subscription is canceled or terminated your unused credits will expire immediately except as stated in our rollover policy or otherwise in writing. There will be no refund or payment for any unused amount.
                      </p>
                      <p className="mt-4">
                        If you have any questions about how to use your credits, please contact us and we can help you.
                      </p>
                      <p className="mt-4">
                        Note that separate and independent from credits, you can buy a gift certificate. Gift certificates and credits are not the same thing. Our gift certificates are called "gift cards". Unlike credits, gift cards never expire. Gift cards are discussed further in Section 4(b) below.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">3. Fees, Billing, Cancellation</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">a) Recurring Billing</h3>
                      <p>
                        By initiating a Trainn subscription, you authorize us to charge you for your initial subscription period and a recurring monthly subscription fee at the then current rate, which may change from time to time. You acknowledge that the amount billed each month may vary for reasons that may include differing amounts due to promotional offers and/or changing or adding a plan, and you authorize us to charge your Payment Method for such varying amounts, which may be billed monthly in advance of providing the service.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">b) Subscription Cycle</h3>
                      <p>
                        When you sign up and purchase your Trainn subscription, your first Subscription Cycle will be billed immediately. Unless we expressly communicate otherwise, for example, with multi-month commitment plans, your subscription will automatically renew each month and you will be billed on the same date each month. We reserve the right to change the timing of our billing (and if we do, we'll make adjustments to the amounts we charge, as appropriate).
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">c) Refunds</h3>
                      <p>
                        Generally, our fees (including the monthly fee for your membership and any other fees) are nonrefundable unless we specifically communicate otherwise at the time of purchase. However, we will provide a refund to subscribers for their current prepaid subscription period only in the following circumstances: (i) if you are cancelling your subscription and request a refund within 5 days of the date of your first payment for your subscription or (ii) if your subscription is terminated by us for reasons other than your breach of these Terms.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">d) Price Changes</h3>
                      <p>
                        We reserve the right to adjust pricing at any time. Unless we expressly communicate otherwise, any price changes to your subscription will take effect on your next billing cycle upon notice communicated through a posting on the Trainn website or mobile application or such other means as we may deem appropriate from time to time, such as email. If you do not cancel your subscription, you will be deemed to have accepted these new fees.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">e) Payment Methods</h3>
                      <p>
                        You may edit your Payment Method information by logging onto our website or mobile application and editing it in your account settings. If a payment is not successfully settled due to expiration, insufficient funds or otherwise, you nonetheless will remain responsible for any uncollected amounts and authorize us to continue billing the Payment Method or any other payment method you have provided, as it may be updated, including in the event you attempt to create a new account.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">f) Cancellation of Subscription</h3>
                      <p>
                        Unless we communicate otherwise, you may terminate your subscription at any time before your subscription renews by going into your account settings on the Trainn website and letting us know you would like to cancel. Unless we communicate otherwise, and except for during a Trial, following any cancellation you will continue to have access to your subscription through the end of your current prepaid Subscription Cycle, unless you cancel and receive a refund as described above.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">g) Other Fees</h3>
                      <p>
                        You are responsible for paying applicable fees if you do not cancel an Offering with appropriate notice or do not attend your scheduled Offering. Click here for our current cancellation and missed Offering rules, including the applicable fees. We reserve the right to change the policy regarding when we charge fees, to introduce additional fees (such as a sign-up fee) and to change the amount of any such fees at any time.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">h) Reservation and Cancellation of Offerings</h3>
                      <p>
                        As a Trainn user, you must reserve and cancel your Offerings only through the Site. Click here for our current cancellation and missed Offering rules, including the applicable fees. It is a breach of these Terms if you reserve or cancel directly with a Venue, including through any online or mobile account you have with a Venue, independent of Trainn. If you reserve or cancel directly with such Venue, we reserve the right to charge you applicable fees.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">i) Fees Charged by Venues</h3>
                      <p>
                        In addition to fees we charge, Venues may also charge equipment or other amenity fees that you will be responsible for directly. For example, some Venues might charge extra to rent a yoga mat or cycling shoes. Further, Trainn only gives you access to the Offering for which you signed up on the Site (and at the specified time and location). The Venue may have additional fees for use of additional Offerings or spaces.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">j) Third Party Fees for Using Trainn</h3>
                      <p>
                        You are also responsible for all third-party charges and fees associated with connecting to and using the Site and/or Offerings, including fees such as internet service provider fees, telephone and computer equipment charges, sales tax and any other fees necessary to access the Site and/or Offerings.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">4. Promotions</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">a) Trials</h3>
                      <p>
                        From time to time we may offer a trial membership that includes access to the Trainn platform during the trial period. The Offerings, content and features available during your Trial may differ from those available during subsequent Subscription Cycles. Trials will have the duration and price communicated at the time you sign up. Unless otherwise communicated, a trial begins at the moment of sign up (even if you choose not to take your first Offering until a later date).
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">b) Gift Cards</h3>
                      <p>
                        From time to time we may make available gift cards for Trainn membership. The current terms that apply to gift cards can be found here. Other than gifting a gift card as described in the gift card terms, you may not gift Offerings or credits to third parties, and your use of Trainn is personal to you. If you purchase credits with a gift card, the terms and conditions of your subscription will apply to those credits, including any limitations on how long those Credits will remain valid.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">c) Refer a Friend</h3>
                      <p>
                        From time to time we may make available certain incentives for Trainn users to refer a friend to use Trainn. The current terms that apply to referrals can be found here.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">d) Other Promotions</h3>
                      <p>
                        Trainn may offer additional types of offers and promotions which will be subject to additional terms and conditions that Trainn may provide.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">5. Termination or Modification by Trainn</h2>
                  <p>
                    You understand and agree that, at any time and without prior notice and without the need to obtain a court order or judgment Trainn may (1) terminate, cancel, deactivate, disable, delete and/or suspend your subscription, your account, any orders placed, or your access to or use of the Site, your membership and/or Offerings (or any portion thereof, including but not limited to your access to any or all Venues, credits or Offerings or services) and/or (2) discontinue, disable, suspend, modify or alter any aspect of the Site and/or Offerings.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">6. Privacy</h2>
                  <p>
                    Your privacy is important to Trainn. The Trainn Privacy Policy is hereby incorporated into these Terms by reference. Please read the privacy policy carefully for information relating to Trainn collection, use, and disclosure of your personal information. When you make a reservation, the applicable Venue partner will have access to certain information about you, such as your name and email address, so it can process the applicable reservation or activity and make available Offerings to you.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">7. Prohibited Conduct</h2>
                  <p className="mb-4">
                    Without limiting the prohibitions and restrictions found elsewhere throughout the Terms, you agree not to:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-sm">
                    <li>Harass, threaten, stalk, disrupt or defraud users, members or staff of Trainn or Venues or any other person, or otherwise create or contribute to an unsafe, harassing, threatening or disruptive environment;</li>
                    <li>Act in a deceptive or fraudulent manner by, among other things, impersonating another person or access another user's account or signing up for more than one account;</li>
                    <li>Share Trainn passwords with any third party or encourage any other user to do so;</li>
                    <li>Permit anyone to use any Offerings or services booked under your own membership, including other members;</li>
                    <li>Reserve or cancel any Offering directly with a Venue, rather than through the Site;</li>
                    <li>Reproduce, modify, prepare derivative works based upon, distribute, license, lease, sell, resell, transfer, publicly display, publicly perform, transmit, stream, broadcast, use for commercial purposes or otherwise exploit any portion of the Site;</li>
                    <li>Misrepresent the source, identity, or content of information transmitted via the Site, including deleting the copyright or other proprietary rights or notices from any portion of the Site;</li>
                    <li>Upload material (e.g. virus) that is damaging to computer systems or data of Trainn or users of the Site or otherwise use the Site in any manner that could damage, disable, overburden, or impair it or interfere with any other party's use and enjoyment of the Site;</li>
                    <li>Upload copyrighted material that is not your own or that you do not have the legal right to distribute, display, and otherwise make available to others;</li>
                    <li>Upload or send to Site users pornographic, threatening, embarrassing, hateful, racially or ethnically insulting, libelous, or otherwise inappropriate content;</li>
                    <li>Use the Site for or in connection with any purpose that is unlawful or prohibited by these Terms.</li>
                  </ul>
                  <p className="mt-4">
                    Trainn Community Guidelines apply. Trainn reserves the right to refuse service, terminate accounts, remove or edit content, or cancel orders in its sole discretion.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">8. User Submissions</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">a) General</h3>
                      <p>
                        The Site provides certain features which enable you and other users to submit, post, share and search for content and information, which may include (without limitation) text, graphic and pictorial works, profile information, information about reserved or attended Offerings, friend connections or any other information submitted by you and other users or arising from your use of the Site ("User Submissions"). User Submissions also include reviews, ratings and other feedback about Venues, Offerings, and other users.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">b) Reviews</h3>
                      <p>
                        You understand and agree that Reviews may be made public without any additional notice to or consent by you and you should assume that any person (whether or not a user of Trainn's platform), including any Venue, may read or have access to your Reviews. Trainn is not responsible for the use or disclosure of any information that you disclose in connection with Reviews, including any personal information. Reviews are displayed for information purposes only and reflect the opinions of individual users.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">c) Right to Remove or Edit User Submissions</h3>
                      <p>
                        Trainn makes no representations that it will publish or make available on the Site any User Submissions, and reserves the right, in its sole discretion, to refuse to allow any User Submissions on the Site, or to edit or remove any User Submission at any time with or without notice. Without limiting the generality of the preceding sentence, Trainn complies with the Digital Millennium Copyright Act, and will remove User Submissions upon receipt of a compliant takedown notice.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">d) License Grant by You to Trainn</h3>
                      <p>
                        You retain all your ownership rights in original aspects of your User Submissions. By submitting User Submissions to Trainn, you hereby grant Trainn Releasees, sublicensees, partners, and designees (collectively, the "Trainn Licensees") a worldwide, non-exclusive, fully paid-up, royalty-free, perpetual, irrevocable, sublicensable, and transferable license to use, reproduce, distribute, modify, adapt, translate, prepare derivative works of, publicly display, publish, publicly perform, and otherwise exploit your User Submissions.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">e) User Submissions Representations and Warranties</h3>
                      <p>
                        By accessing and/or using our services, you hereby grant the Trainn Licensees a worldwide, non-exclusive, fully paid-up, royalty-free, perpetual, irrevocable, sublicensable, and transferable license to use, reproduce, distribute, modify, adapt, translate, prepare derivative works of, publicly display, publish, publicly perform, and otherwise exploit your User Submissions and derivative works thereof in any form, media, or technology now known or later developed.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">f) Inaccurate or Offensive User Submissions</h3>
                      <p>
                        You understand that when using the Site, you may be exposed to User Submissions from a variety of sources and that Trainn does not endorse and is not responsible for the accuracy, usefulness, safety, or intellectual property rights of or relating to such User Submissions. You further understand and acknowledge that you may be exposed to User Submissions that are inaccurate, offensive, indecent, or objectionable. YOU AGREE TO WAIVE, AND HEREBY DO WAIVE, ANY LEGAL OR EQUITABLE RIGHTS OR REMEDIES YOU HAVE OR MAY HAVE AGAINST TRAINN WITH RESPECT THERETO.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">g) Feedback</h3>
                      <p>
                        If you provide Trainn with any comments, bug reports, feedback, or modifications proposed or suggested by you to the Site ("Feedback"), Trainn shall have the right to use such Feedback at its discretion, including, but not limited to the incorporation of such suggested changes into the Site. You hereby grant Trainn a perpetual, irrevocable, nonexclusive license under all rights necessary to incorporate and use your Feedback for any purpose without notice to, consent by, or payment to you.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">h) Infringing or Illegal Activity</h3>
                      <p>
                        In the event of infringing or other illegal activities, we have no obligation to, but reserve the right to terminate access to the Site and remove all content submitted by any persons who are found to be infringers. Any suspected illegal activity may be referred to appropriate law enforcement authorities. These remedies are in addition to any other remedies Trainn may have at law or in equity.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="mt-12 pt-8 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    This document contains excerpts from the complete Terms of Service. For the full terms and conditions, please refer to the complete document or contact us directly.
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