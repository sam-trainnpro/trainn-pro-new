import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                Trainn Privacy Policy
              </CardTitle>
              <p className="text-center text-gray-600 mt-2">
                Last Updated: June 2, 2025
              </p>
            </CardHeader>
            <CardContent>
            <div className="prose max-w-none">
              <div className="mb-8">
                <p className="mb-4">
                  Trainn respects your right to privacy. This Privacy Policy explains who we are, how we and our Group Companies (defined below) collect, share, and use personal information about you, and how you can exercise your privacy rights.
                </p>
                
                <p className="mb-4">
                  This Privacy Policy applies to our website at trainn.pro and our mobile applications (collectively, the "Site") and other services that we may provide from time to time. If you have any questions or concerns about our use of your personal information, please see the "How to Contact Us" section below.
                </p>
                
                <p className="mb-4">
                  To provide information to us through registration or in any other manner on the Site, you must be 18 years of age or older.
                </p>
                
                <p className="mb-4">
                  Residents in certain countries and US states, including California, should be sure to review any additional privacy notices set out in the "Special Terms" section below.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">1. What Does Trainn Do?</h2>
                <p className="mb-4">
                  Trainn enables consumers ("Trainn Users") to find, book and attend a wide range of fitness, recreational, sports, music, art and wellness classes, services, or products offered and operated by trainers, teachers, fitness studios, gyms, venues or other third parties through our platform ("Partners").
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">2. What Personal Information Does Trainn Collect?</h2>
                <p className="mb-4">
                  We collect or receive personal information in a few different ways. Often, you choose what information to provide, but sometimes we require certain information in order for you to use, and for us to provide you with, the Site and the services you access through the Site.
                </p>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Personal Information You Provide To Us.</h3>
                  <p className="mb-4">
                    There are a variety of different ways you may provide personal information to us, such as:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>
                      <strong>Account Creation.</strong> To create a Trainn User account, you need to provide information such as your name, email address, phone number, sign-up city, and a password. If you make a purchase or sign up for a subscription, you will need to provide payment and billing information. You can choose to add further information to your account, such as birthdate, gender, photo, and address. If you are a Trainn Partner we will ask for your name, address, phone number, email, credit card information, tax identification number, and information about your business, including the names of the instructors and individuals who provide your classes and services and the email addresses of authorized individuals on your account. We also process and store payment information, such as purchase history and billing information.
                    </li>
                    <li>
                      <strong>Posting and Uploading.</strong> We collect personal information from you when you provide, post, or upload it to our Site, such as when you respond to a survey or provide a class rating or review.
                    </li>
                    <li>
                      <strong>Communications Data.</strong> We may send messages to you about our services and products, or on behalf of, or initiated by, Partners or Trainn Users. For example, we may enable Partners to send text or in-app messages to Trainn Users via our Site about an upcoming reservation. Trainn receives data regarding such calls, texts, or other communications, including the date and time of the communication and its content.
                    </li>
                    <li>
                      <strong>Instructor Data.</strong> Trainn Partners may provide information about instructors and other individuals who work at their businesses. Trainn Partners are responsible for notifying instructors and others that their information will be shared with Trainn, for example by providing a link to this Privacy Policy. You should not provide information to us about someone else unless you have obtained all necessary and applicable permissions or consents of the other person for us to receive and use their information.
                    </li>
                    <li>
                      <strong>Third-Party Data.</strong> If you are a Trainn User, you should not provide information to us about someone else unless you have obtained all necessary and applicable permissions or consents of the other person for us to receive and use their information, such as for emergency contact or referral purposes.
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Personal Information Collected Automatically Through Your Use of the Site.</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>
                      We log usage data when you visit or otherwise use our Site, such as when you view or click on content or ads (on or off our Site), perform a search, browse, schedule a reservation, and install or update one of our mobile apps. Specifically, the information we collect automatically may include information like internet protocol address, device type, unique device identification numbers, browser-type, broad geographic location (e.g., country or city-level location), language and marketing preferences and other technical information. We may also collect information about how your device has interacted with our Site, including the pages accessed and links clicked.
                    </li>
                    <li>
                      We may also collect precise geolocation data pertaining to your mobile device if you have consented to providing this to us through your device settings. We may use this information to provide, promote, and improve our services (for example, by showing you classes that are close to your location) and for related reasons, such as fraud prevention and security purposes. Please note that if you do not consent to providing your geolocation data, certain features of the mobile application may not work.
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Personal Information Collected from Other Sources.</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>
                      We may receive personal information about you from other sources, such as public databases, strategic and joint marketing partners, social media pages and platforms, people with whom you are friends or otherwise connected on social media platforms, as well as from other third parties. For example, where we make this available, you may choose to sync your Trainn User account details with a third-party network, such as Facebook. If you do this, we will receive some of your Facebook account information. Exactly what information we receive will depend on your settings with the third-party network, but typically we receive your basic public profile information such as your username, email address, age range, gender, chosen language, country, friends list and any other public information.
                    </li>
                    <li>
                      As noted above, if you are an instructor or another individual working at one of our Partners' facilities, we may receive your personal information from the Partner.
                    </li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Personal Information About Trainn Users Collected from Partners.</h3>
                  <p className="mb-4">
                    Our Partners may choose to submit feedback to us about Trainn Users' use of their facilities or services.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">3. What Does Trainn Do with the Personal Information it Collects?</h2>
                <p className="mb-4">
                  Trainn uses personal information it receives for several purposes:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    <strong>Site:</strong> To operate and maintain our Site and the products and services offered through our Site. For example, we use Trainn User personal information to fulfill your reservation and purchase requests, including processing payments and issuing any late cancel/no show fees incurred, and to customize your experience on our Site, such as by tailoring the content or experiences we show you, as well as for the purposes set out in our <Link href="/terms" className="text-blue-600 hover:underline">Terms of Use</Link>. We use personal information about instructors made available by Partners to display within schedules, including reviews, listed on our Site.
                  </li>
                  <li>
                    <strong>Communication:</strong> To contact you through email, phone, postal mail, notices, and push notifications posted on our websites or apps, and other ways. We will send you messages about the availability of our Site, security, customer service, or other service-related issues. We also send messages about the Site, updates, reminders, and promotional messages in accordance with your communications preferences. We may also send you messages about an upcoming reservation which are initiated by a Partner or a Trainn User on their behalf. You may change your communication preferences at any time. Please be aware that you cannot opt-out of receiving service messages from us, including security and legal notices. Please note that during phone conversations conducted with Partners and other third parties via Zoom, we may ask whether you would like additional information to be sent to you via SMS. If you agree, the phone number and opt-in you provide in response will not be sold to, or shared with, third party providers or affiliates for marketing or promotional purposes.
                  </li>
                  <li>
                    <strong>Customer Support:</strong> In connection with customer service inquiries and matters, such as to investigate, respond to and resolve complaints and service issues.
                  </li>
                  <li>
                    <strong>Social:</strong> To provide features which allow Trainn Users to connect with, and be found by, other Trainn Users.
                  </li>
                  <li>
                    <strong>Marketing:</strong> For our marketing purposes, such as to develop our marketing strategies, send you marketing communications by email, SMS and telephone, to target digital marketing to you via third party websites and apps, and to offer contests, sweepstakes, or other promotions and to fulfill any related awards or discounts. You can exercise choices over the marketing we send to you as described in the "Your Data Protection Rights" section below and, for residents in certain countries and US states, including California, within our additional privacy notice set out in the "Special Terms" section below.
                  </li>
                  <li>
                    <strong>Research and Development:</strong> For research, analytical, recordkeeping, and reporting purposes; to develop and test new products, features and ideas; to learn about our customer base and Site and to evolve and improve our Site, products, and services.
                  </li>
                  <li>
                    <strong>Security, Investigations and Eligibility:</strong> To maintain the security of our Site, including to verify your identity, to investigate or prevent possible fraud or other violations of our Terms of Use or this Privacy Policy and/or in connection with possible attempts to harm Trainn Users, Site visitors, Partners or other third parties, and to confirm your eligibility for promotions we may run from time to time, such as free trials.
                  </li>
                  <li>
                    <strong>Business and Operational Support:</strong> To assess and implement mergers, acquisitions, reorganizations, bankruptcies, and other business transactions such as financings, and to administer our business, accounting, auditing, compliance, recordkeeping, and legal functions.
                  </li>
                  <li>
                    <strong>Other:</strong> For any other purpose identified at the point of collection or otherwise with your consent.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">4. Who Does Trainn Share My Personal Information With?</h2>
                <p className="mb-4">
                  We may disclose your personal information to the following categories of recipients or in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    To services providers and partners who provide data processing and other services to us (for example, to support the delivery of, provide functionality on, or help to enhance the security of our Site, payment card processors, customer support vendors, hosting vendors, scheduling providers and market research and marketing vendors), or who otherwise process personal information for purposes that are described in this Privacy Policy or notified to you when we collect your personal information;
                  </li>
                  <li>
                    To our Group Companies so that they can provide, develop, improve, and analyze the Site and their own services and products, as well as for our Group Companies' own internal and marketing purposes, including to send you marketing communications by email, SMS and telephone and for targeted digital marketing about their services and products;
                  </li>
                  <li>
                    To any Partner that makes available a class, activity or experience you reserve or use through our Site as a Trainn User and their third-party providers, so that they can process the applicable reservation or activity and make available classes and services to you;
                  </li>
                  <li>
                    Your name, photo and other information associated with your Trainn User account will be visible to other Trainn Users so that they can search for and connect with you on Trainn. You can prevent other Trainn Users from being able to search for you by updating your preferences via the Privacy tab in your Account Settings;
                  </li>
                  <li>
                    If you sync your Trainn User account to a third-party network, such as Facebook, or provide us with your contacts, such as those stored on your mobile device, you will be able to see which of your contacts are using Trainn. If those contacts are Trainn members, they will also be able to see that you are using Trainn;
                  </li>
                  <li>
                    If you accept a friend request from another Trainn User then, in addition to your name, photo and other information associated with your account, that Trainn User will also be able to see your past and upcoming classes, your achievement badges, your favorite studios, your friend connections and other profile information (together, "Profile Information"). We may use, communicate, and display your Profile Information next to or in connection with ads, offers, and other messages to your Trainn friends – for example, by sending an email to one of your Trainn friends to suggest that they join you in class. If you would like to stop your Profile Information being shared with your Trainn friends in this way, you can do so via the Privacy tab in your Account Settings;
                  </li>
                  <li>
                    To anyone who visits the public area of our Site, including via venue and schedule listings, public profiles, reviews, or class ratings. As a Trainn User, you should be aware that any content or information you choose to disclose in public areas of our Site can be read, collected, and used by other users, the general public and other sites (including search engines);
                  </li>
                  <li>
                    To any competent law enforcement body, regulatory, government agency, court, or other third -party where we believe disclosure is necessary as a matter of applicable law or regulation, to exercise, establish or defend our legal rights, or to protect your vital interests or those of any other person;
                  </li>
                  <li>
                    In connection with an actual or potential merger, sale, acquisition, investment, assignment, reorganization, joint venture, or transfer of all or part of Trainn's business, assets, or affiliates or Group Companies, including if Trainn should ever file for bankruptcy or a related proceeding, provided that we inform the relevant third-party it must use your personal information only for the purposes disclosed in this Privacy Policy;
                  </li>
                  <li>
                    To your program administrator (such as your employer or similar entity), if you participate in any enterprise solutions or the Trainn Corporate Program; and
                  </li>
                  <li>
                    To any other person with your consent to the disclosure or otherwise in accordance with applicable law.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">5. How does Trainn Keep My Personal Information Secure?</h2>
                <p className="mb-4">
                  We use security procedures and practices to protect the personal information that we collect and process about you. We monitor our systems for possible vulnerabilities and attacks. However, we cannot guarantee 100% security of any information that you send us.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">6. International Data Transfers</h2>
                <p className="mb-4">
                  Your personal information may be transferred to, and processed in, countries other than the country in which you are resident, including outside of the EEA, the UK, Switzerland, Japan and Canada (including Quebec). These countries may have data protection laws that differ from the laws of your country (and, in some cases, may not be as protective). Specifically, our Site servers are located in the United States and our third-party service providers and partners operate around the world. This means that when we collect your personal information, we may process it in any of these countries.
                </p>
                <p className="mb-4">
                  Some countries recognize the data protection laws of other countries as providing an adequate level of data protection according to local standards. For example, some non-EEA countries are recognized by the European Commission as providing an adequate level of data protection according to EEA standards (the full list of these countries is available at https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/rules-international-data-transfers_en).
                </p>
                <p className="mb-4">
                  However, where this is not the case, we take appropriate safeguards in accordance with applicable laws to require that your personal information will remain protected in accordance with this Privacy Policy. These include implementing standard contractual clauses (such as the EU Standard Contractual Clauses and the UK International Data Transfer Addendum) which require Group Companies and service providers to protect personal information that they process which originates from the EEA, the UK, or other jurisdictions with comparable laws (as applicable) in accordance with local data protection laws. A copy of our standard contractual clauses, if applicable, and information about the other similar appropriate safeguards we take with respect to international data transfers can be provided upon request (see How to Contact Us).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
                <p className="mb-4">
                  We retain personal information we collect from you where we have an ongoing legitimate business need to do so (for example, to provide you with a service you have requested or to comply with applicable legal, tax or accounting requirements). When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">8. Your Data Protection Rights</h2>
                <p className="mb-4">
                  Where applicable law allows for such rights, you may have the following data protection rights:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    You have the right to opt-out of receiving direct marketing communications we send you at any time. To opt-out of receiving email marketing, you should click on the "unsubscribe" or "opt-out" link in the marketing e-mails we send you. To opt-out of receiving SMS messages from us, you can reply STOP to any SMS messages. To opt-out of other forms of marketing (such as postal marketing, telemarketing or targeted digital marketing) please contact us as explained in the "How to Contact Us" section below.
                  </li>
                  <li>
                    You may correct or amend your personal information by editing your profile on the Site or contacting us as explained in the "How to Contact Us" section below.
                  </li>
                  <li>
                    You may delete your personal information by contacting us as explained in the "How to Contact Us" section below.
                  </li>
                  <li>
                    You may object to processing of your personal information, ask us to restrict processing of your personal information, access the personal information we hold about you, or request portability of your personal information by contacting us as explained in the "How to Contact Us" section below.
                  </li>
                  <li>
                    If we have collected and process your personal information with your consent, then you can withdraw your consent at any time. Withdrawing your consent will not affect the lawfulness of any processing we conducted prior to your withdrawal, nor will it affect processing of your personal information conducted in reliance on lawful processing grounds other than consent (where applicable). You can withdraw your consent by contacting us as explained in the "How to Contact Us" section below.
                  </li>
                </ul>
                <p className="mb-4">
                  Residents in certain countries and US states have additional rights with respect to personal information collected by businesses and should review any additional privacy notices set out in the "Special Terms" section below.
                </p>
                <p className="mb-4">
                  If you have any questions relating to your rights as set out in this Privacy Policy you may contact us as explained in the "How to Contact Us" section below.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">9. Third-Party Sites</h2>
                <p className="mb-4">
                  Our Site may contain links to third-party websites or mobile apps, including social sharing features and other related tools. Please be aware that Trainn does not control these linked websites or apps and that this Privacy Policy does not apply to any information you give to the owner of these websites or apps. We encourage you to read the privacy policy of any third-party website or app that you visit before you provide them with any information.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">10. Updates to this Privacy Policy</h2>
                <p className="mb-4">
                  By using our Site, you agree to this Privacy Policy. We may occasionally update this Privacy Policy. Any changes we make will become effective when we post a modified version of the Privacy Policy to trainn.pro. If we make any material changes to the Privacy Policy, we will take appropriate measures to inform you consistent with the significance of the changes we make and as required by applicable law. If you continue using our products and services after any notice of such changes, it means you have accepted them. Your continued use of this Site after any notice of such changes constitutes your agreement to this Privacy Policy and any updates. If you do not agree to any changes, you must stop using our products and services, as applicable. It is your obligation to ensure that you read, understand and agree to the latest version of the Privacy Policy. The "Last Updated" legend at the top of the Privacy Policy indicates when it was last updated.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">11. How to Contact Us</h2>
                <p className="mb-4">
                  If you have any questions or concerns about our use of your personal information, please contact us here
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">12. Special Terms (US Residents)</h2>
                <p className="mb-4">
                  If you are a resident of certain states with comprehensive privacy laws, including but not limited to California, Colorado, Connecticut, Delaware, Iowa, Indiana, Montana, New Jersey, Oregon, Texas, Tennessee, Utah or Virginia, state privacy laws require that we disclose additional information to you about the processing of your personal information and your privacy rights.
                </p>
                <p className="mb-4">
                  Depending on how you interact with us, in the previous 12 months we have collected the categories of personal information from the sources set out at Section 2. We collect this information for the purposes set out at Section 3 and otherwise to accomplish our business and operational purposes (including for audits, helping to ensure the security and integrity of our systems, debugging, the effective operation of our Site and business, internal research and quality purposes), and we may disclose such categories to the third parties set out at Section 4 in furtherance of those purposes. For further information, please contact us as explained in the "How to Contact Us" section.
                </p>
                <p className="mb-4">
                  Certain states, such as California, provide residents a right to limit the use of their sensitive personal information. However, we do not engage in uses or disclosures of sensitive personal information that would trigger the right to limit under state law.
                </p>
                <p className="mb-4">
                  To the extent that we are in possession of de-identified data, we commit to maintaining and using de-identified data without attempting to re-identify the data.
                </p>
                <p className="mb-4">
                  We retain your personal information as described under the "Data Retention" section above.
                </p>
                <p className="mb-4">
                  Currently, our Site does not recognize "Do-Not-Track" requests.
                </p>
                <p className="mb-4">
                  If you are a resident of any of the states listed above, you may have the right under applicable local data protection laws to exercise the following rights regarding your personal information, subject to certain exceptions and limitations:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>
                    for certain categories of personal information, the right to request a list of what personal information (if any) we disclosed to third parties for their own direct marketing purposes in the preceding calendar year and the names and addresses of those third parties;
                  </li>
                  <li>
                    the right to know the categories and specific pieces of personal information we collect, use, disclose, and sell about you, the categories of sources from which we collected your personal information, our purposes for collecting or selling your personal information, the categories of your personal information that we have either sold or disclosed for a business purpose, and the categories of third parties with which we have shared personal information;
                  </li>
                  <li>
                    the right to request that we delete the personal information we have collected from you or maintain about you;
                  </li>
                  <li>
                    the right to correct inaccurate personal information that we maintain about you;
                  </li>
                  <li>
                    the right to limit the use and disclosure of sensitive personal information; however, note that we do not use or disclose sensitive personal information in a manner that would trigger such right under applicable local data protection laws;
                  </li>
                  <li>
                    the right to opt out of our sale(s) or sharing of your personal information, or use of your personal information for targeted advertising (if any);
                  </li>
                  <li>
                    if we reject your request to exercise a privacy right, under certain local data protection laws you may have the right to appeal our rejection by contacting us as explained in the "How to Contact Us" section; and
                  </li>
                  <li>
                    the right not to receive discriminatory treatment for the exercise of your privacy rights.
                  </li>
                </ul>
                <p className="mb-4">
                  You may designate an authorized agent to make a request on your behalf. You can do this by authorizing your agent to access your Trainn account and making a request on your behalf by contacting us as explained in the "How to Contact Us" section. Before responding to your request, we must first verify your identity using the personal information you recently provided to us. You must provide us with your full name and email address. We will take steps to verify your request by matching the information provided by you with the information we have in our records. In some cases, we may request additional information in order to verify your identity, or where necessary to process your request. If we are unable to verify your identity after a good faith attempt, we may deny the request and, if so, will explain the basis for the denial. We respond to all requests we receive from individuals wishing to exercise their data protection rights in accordance with applicable data protection laws.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
      <Footer />
    </div>
  );
}