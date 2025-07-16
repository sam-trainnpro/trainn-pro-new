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
                    <strong>Site:</strong> To operate and maintain our Site and the products and services offered through our Site. For example, we use Trainn User personal information to fulfill your reservation and purchase requests, including processing payments and issuing any late cancel/no show fees incurred, and to customize your experience on our Site, such as by tailoring the content or experiences we show you, as well as for the purposes set out in our Terms of Use. We use personal information about instructors made available by Partners to display within schedules, including reviews, listed on our Site.
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
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
      <Footer />
    </div>
  );
}