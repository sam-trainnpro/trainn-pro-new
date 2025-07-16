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

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">i) Eligibility.</h3>
                    <p className="mb-4">
                      The availability of all or part of our Site and/or Offerings may be limited based on geographic, age, or other criteria as we may establish from time to time. You understand and agree we may disallow you from subscribing to Trainn or may terminate your subscription at any time based on these criteria. For example, you must be 18 years of age or older to use the Site and/or Offerings and/or purchase a class offered on Trainn or a Trainn subscription. You further understand that the Site and/or Offerings may not be available in every geography.
                    </p>
                    
                    <p className="mb-4">
                      PLEASE ENSURE YOU ARE VIEWING THE TERMS OF USE FOR THE COUNTRY IN WHICH YOU ARE LOCATED. 
                    </p>
                    
                    <p className="mb-4">
                      THESE TERMS ARE ONLY APPLICABLE TO USERS IN THE U.S. OR THE COUNTRY FOR WHICH A REGIONAL AMENDMENT IS AVAILABLE AT THE END OF THESE TERMS. THE SITE IS NOT AVAILABLE TO ANY USERS SUSPENDED OR REMOVED FROM THE SITE BY TRAINN. BY USING THE SITE, YOU REPRESENT THAT YOU ARE A RESIDENT OF THE U.S. OR THE COUNTRY FOR WHICH A REGIONAL AMENDMENT IS AVAILABLE AT THE END OF THESE TERMS, AT LEAST 18 YEARS OLD AND HAVE NOT BEEN PREVIOUSLY SUSPENDED OR REMOVED. THOSE WHO CHOOSE TO ACCESS THE SITE DO SO AT THEIR OWN INITIATIVE AND ARE RESPONSIBLE FOR COMPLIANCE WITH ALL LOCAL RULES INCLUDING, WITHOUT LIMITATION, RULES ABOUT THE INTERNET, DATA, EMAIL OR OTHER ELECTRONIC MESSAGES, OR PRIVACY.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">j) Communications.</h3>
                    <p className="mb-4">
                      By providing your information or creating an account, you agree that Trainn may contact you by email, direct mail, telephone or text messages at any of the addresses or phone numbers, as applicable, provided by you or on your behalf in connection with a Trainn account, including for marketing purposes. You may opt-out of marketing emails via the provided unsubscribe link or otherwise opt-out by contacting us at any time.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">k) Subscribing Organizations.</h3>
                    <p className="mb-4">
                      If you have express permission from Trainn to open or use an account on behalf of a company, entity, or organization (a "Subscribing Organization"), then you represent and warrant that you are an authorized representative of such organization with the authority to bind it to these Terms; and agree to be bound by these Terms on its behalf.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">l) Your responsibility for yourself and others.</h3>
                    <p className="mb-4">
                      Unless Trainn specifically communicates otherwise for a particular Offering, you are not permitted to make reservations on behalf of anyone but yourself or invite or bring anyone to your reservation. You are responsible and liable for your own acts and omissions and anyone for whom you make a reservation or bring to a reservation (including if the guest arrives separately). For example, this means: (i) you are responsible for leaving all facilities you visit in the condition they were in when you arrived and paying for any damage you or your guests cause, and (ii) you must act with integrity, treat others with respect, and comply with all applicable laws at all times. If Trainn authorizes you to book for a guest who is a minor or bring a minor to a reservation, you must be legally authorized to act on behalf of the minor, and you are solely responsible for supervising the minor.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">m) Reimbursement.</h3>
                    <p className="mb-4">
                      Trainn makes no representations or guarantees that any purchase you make through Trainn will be reimbursable through your insurance or otherwise and has no obligation to facilitate any such reimbursement. You are solely responsible for ensuring that you and your purchases or uses qualify for any applicable reimbursements.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">3. Fees, Billing, Cancellation</h2>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">a) Recurring Billing.</h3>
                    <p className="mb-4">
                      By initiating a Trainn subscription, you authorize us to charge you for your initial subscription period and a recurring monthly subscription fee at the then current rate, which may change from time to time. You acknowledge that the amount billed each month may vary for reasons that may include differing amounts due to promotional offers and/or changing or adding a plan, and you authorize us to charge your Payment Method for such varying amounts, which may be billed monthly in one or more charges. You also authorize us to charge you any other fees you may incur in connection with your use of the Site, such as any applicable sign-up fee, taxes and cancellation or late fees, as further explained below. Note that even if you do not use the subscription or access the Site and/or Offerings, you will be responsible for subscription fees until you cancel your subscription, or it is otherwise terminated.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">b) Subscription Cycle.</h3>
                    <p className="mb-4">
                      When you sign up and purchase your Trainn subscription, your first Subscription Cycle will be billed immediately. Unless we expressly communicate otherwise, for example, with multi-month commitment plans, your subscription will automatically renew each month and you will be billed on the same date each month. We reserve the right to change the timing of our billing (and if we do, we'll make adjustments to the amounts we charge, as appropriate). In the event your paid subscription began on a day not contained in a given month, we may bill your Payment Method on a day in the applicable month or such other day as we deem appropriate. For example, if you started your Trainn membership or became a paying member on June 30th, your next payment date is likely to be July 31st, and your Payment Method would be billed on that date. Your renewal date may change due to changes in your subscription.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">c) Refunds.</h3>
                    <p className="mb-4">
                      Generally, our fees (including the monthly fee for your membership and any other fees) are nonrefundable unless we specifically communicate otherwise at the time of purchase. However, we will provide a refund to subscribers for their current prepaid subscription period only in the following circumstances: (i) if you are cancelling your subscription and request a refund within 5 days of the date of your first payment for your subscription or (ii) if your subscription is cancelled prior to the end of a period for which you have incurred a charge, due to your relocation, disability or death; provided, however, in each case we reserve the right to charge a fee to cover the cost of any Offering or other services or products you may have used or received prior to your cancellation and to ask for proof of such changed condition, to the extent permitted by law. WE DO NOT PROVIDE REFUNDS OR MAKE GOODS FOR ANY PRIOR MONTHS INCLUDING FOR UNUSED CREDITS OR OFFERINGS.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">d) Price Changes.</h3>
                    <p className="mb-4">
                      We reserve the right to adjust pricing at any time. Unless we expressly communicate otherwise, any price changes to your subscription will take effect on your next billing cycle upon notice communicated through a posting on the Trainn website or mobile application or such other means as we may deem appropriate from time to time, such as email. If you do not cancel your subscription, you will be deemed to have accepted these new fees.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">e) Payment Methods.</h3>
                    <p className="mb-4">
                      You may edit your Payment Method information by logging onto our website or mobile application and editing it in your account settings. If a payment is not successfully settled due to expiration, insufficient funds or otherwise, you nonetheless will remain responsible for any uncollected amounts and authorize us to continue billing the Payment Method or any other payment method you have provided, as it may be updated, including in the event you attempt to create a new account, reactivate the unsettled account or sign up for a new account. This may result in a change to your payment billing dates. If we cannot charge your account, we reserve the right, but are not obligated, to terminate your access to our Site or any portion thereof.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">f) Cancellation of Subscription.</h3>
                    <p className="mb-4">
                      Unless we communicate otherwise, you may terminate your subscription at any time before your subscription renews by going into your account settings on the Trainn website and letting us know you would like to cancel. Unless we communicate otherwise, and except for during a Trial, following any cancellation you will continue to have access to your subscription through the end of your current prepaid Subscription Cycle, unless you cancel and receive a refund in which case your access will be terminated immediately. Note that if you do terminate your subscription, we reserve the right to charge a reactivation fee if you want to return to Trainn in future months or to restrict your access in future months. If you cancel your subscription or it is terminated for any reason, you will lose access to all Offerings, content, credits or features available through the subscription.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">g) Other Fees.</h3>
                    <p className="mb-4">
                      You are responsible for paying applicable fees if you do not cancel an Offering with appropriate notice or do not attend your scheduled Offering. Click here for our current cancellation and missed Offering rules, including the applicable fees. We reserve the right to change the policy regarding when we charge fees, to introduce additional fees (such as a sign-up fee) and to change the amount of any such fees at any time.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">h) Reservation and Cancellation of Offerings.</h3>
                    <p className="mb-4">
                      As a Trainn user, you must reserve and cancel your Offerings only through the Site. Click here for our current cancellation and missed Offering rules, including the applicable fees. It is a breach of these Terms if you reserve or cancel directly with a Venue, including through any online or mobile account you have with a Venue, independent of Trainn. If you reserve or cancel directly with such Venue, we reserve the right to charge you the full amount that the Venue charges for such Offering and/or any applicable cancellation fees, and/or to suspend or terminate your subscription.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">i) Fees Charged by Venues.</h3>
                    <p className="mb-4">
                      In addition to fees we charge, Venues may also charge equipment or other amenity fees that you will be responsible for directly. For example, some Venues might charge extra to rent a yoga mat or cycling shoes. Further, Trainn only gives you access to the Offering for which you signed up on the Site (and at the specified time and location). The Venue may have additional fees for use of additional Offerings or spaces.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">j) Third Party Fees for Using Trainn.</h3>
                    <p className="mb-4">
                      You are also responsible for all third-party charges and fees associated with connecting to and using the Site and/or Offerings, including fees such as internet service provider fees, telephone and computer equipment charges, sales tax and any other fees necessary to access the Site and/or Offerings.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">4. Promotions</h2>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">a) Trials.</h3>
                    <p className="mb-4">
                      From time to time we may offer a trial membership that includes access to the Trainn platform during the trial period. The Offerings, content and features available during your Trial may differ from those available during subsequent Subscription Cycles. Trials will have the duration and price communicated at the time you sign up. Unless otherwise communicated, a trial begins at the moment of sign up (even if you choose not to take your first Offering until a later date) and ends at 11:59pm local time (based on your location when you signed up for Trainn) on the last day of the trial (for a one-week trial, this would be the same weekday of following week). If you cancel your Trial, your cancellation will be processed and your Trial period will end immediately, your credits will expire, and your upcoming reservations will be cancelled, unless we communicate otherwise. Each trial membership automatically will convert to a regular monthly subscription and price unless canceled by 11:59 pm local time (based on your location when you signed up for Trainn) on the last day of trial. Unless we communicate otherwise in writing, customers that cancel and do not convert to a regular subscription may not attend Offerings taking place after the end of the trial membership period (even if booking occurred before the end of the applicable trial period). Trials, discount offers, and promotions (collectively "Trials") may be redeemed as described in the specifics of the promotion and may be subject to additional or different terms. Unless we expressly communicate otherwise, Trials cannot be transferred, sold, bartered, combined with other offers, or redeemed for cash, and they are void where prohibited. You understand and agree that unless we expressly communicate otherwise, Trials are available only to new users that have never had a Trainn account before and there is only one Trial permitted per credit card or payment method and it is a violation of these Terms to sign up for a Trial if you have signed up for an account or trial in the past or to have more than one account or trial. Trainn reserves the right, in its absolute discretion, to determine your eligibility for a Trial. If in our discretion we believe you are not eligible for a Trial, we reserve the right to prevent you from signing up for a Trial or to terminate your promotional subscription. If we terminate your Trials because you have violated these Terms, you understand that you will not be eligible for a refund.
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