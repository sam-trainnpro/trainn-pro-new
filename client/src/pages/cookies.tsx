import { useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function CookiesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
            <p className="text-gray-600">Last Updated: June 2, 2025</p>
          </div>
          
          <div className="space-y-8">
            <div>
              <p className="mb-4">
                This Cookie Policy explains how Trainn and its subsidiaries (collectively " Trainn", " we", " us", and " ours" use cookies and similar technologies to recognise you when you visit our websites and use our mobile applications (" Site"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">What are cookies?</h2>
              <p className="mb-4">
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information. Cookies set by the website owner (in this case, Trainn) are called "first party cookies". Cookies set by parties other than the website owner are called "third party cookies". Third party cookies enable third party features or functionality to be provided on or through the website (e.g. like advertising, interactive content and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Why do we use cookies?</h2>
              <p className="mb-4">
                We use first party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Sites to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Websites. Third parties serve cookies through our Sites for advertising, analytics and other purposes. This is described in more detail below.
              </p>
              <p className="mb-4">
                First and third-party cookies served through our Sites and the purposes they perform are described below:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Essential website cookies:</strong> These cookies are strictly necessary to provide you with services available through our Sites and to use some of its features, such as access to secure areas.
                </li>
                <li>
                  <strong>Performance and functionality cookies:</strong> These cookies are used to enhance the performance and functionality of our Sites but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.
                </li>
                <li>
                  <strong>Analytics and customization cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our Sites are being used or how effective our marketing campaigns are, or to help us customize our Sites for you.
                </li>
                <li>
                  <strong>Advertising cookies:</strong> These cookies are used to make advertising messages more relevant to you and they perform functions like preventing the same ad from continuously reappearing and in some cases selecting and displaying advertisements to you across the internet that are based on your interests.
                </li>
                <li>
                  <strong>Social networking cookies:</strong> These cookies are used to enable you to share pages and content that you find interesting on our Sites through third party social networking and other websites. These cookies may also be used for advertising purposes too.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">What about other tracking technologies?</h2>
              <p className="mb-4">
                Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files that contain a unique identifier that enable us to recognize when someone has visited our Sites or opened an e-mail that we have sent them. This allows us, for example, to monitor the traffic patterns of users from one page within our Sites to another, to deliver or communicate with cookies, to understand whether you have come to our Sites from an online advertisement displayed on a third-party website, to improve site performance, and to measure the success of e-mail marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will impair their functioning.
              </p>
              <p className="mb-4">
                Our mobile applications may include third-party application software development kits that provide mobile performance and analytics data, bug reporting features, and APIs to third parties that help provide the Site, for social media functionality, and for marketing and advertising.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Does Trainn serve targeted advertising?</h2>
              <p className="mb-4">
                As described above, third parties may serve cookies on your computer or mobile device through the Sites to serve advertising. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that you may be interested in. They may also employ technology that is used to measure the effectiveness of advertisements. This can be accomplished by them using cookies or web beacons to collect information about your visits to this and other sites in order to provide relevant advertisements about goods and services of potential interest to you. The information collected through this process does not enable us or them to identify your name, contact details or other personally identifying details unless you choose to provide these.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">How can I control cookies?</h2>
              <p className="mb-4">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences for certain third-party cookies by clicking on the appropriate opt-out links provided above. You can also set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our Site though your access to some functionality and areas of our website may be restricted, you may worsen your overall user experience, since it will no longer be personalized to you and it may also stop you from saving customized settings like login information. As the means by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your browser's help menu for more information. To revoke consent, users may disable cookies by modifying their browser settings. The links listed below provide more information about what cookies are installed, how to allow, block or remove installation from your computer. Depending on which browser you use, the user may follow these links:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Firefox:</strong> <a href="https://support.mozilla.org/en-US/products/firefox/protect-your-privacy/cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://support.mozilla.org/en-US/products/firefox/protect-your-privacy/cookies</a>
                </li>
                <li>
                  <strong>Chrome:</strong> <a href="http://support.google.com/chrome/bin/answer.py?hl=es&answer=95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://support.google.com/chrome/bin/answer.py?hl=es&answer=95647</a>
                </li>
                <li>
                  <strong>Safari:</strong> <a href="http://support.apple.com/kb/ph5042" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://support.apple.com/kb/ph5042</a>
                </li>
                <li>
                  <strong>Explorer:</strong> <a href="http://windows.microsoft.com/es-es/windows7/how-to-manage-cookies-in-internet-explorer-9" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://windows.microsoft.com/es-es/windows7/how-to-manage-cookies-in-internet-explorer-9</a>
                </li>
              </ul>
              <p className="mb-4">
                In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://www.aboutads.info/choices/</a>, <a href="https://www.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.networkadvertising.org/</a>, or <a href="http://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://www.youronlinechoices.com</a>. Please bear in mind that there are many more networks listed on that site than those that we use on our Website.
              </p>
              <p className="mb-4">
                We use Google cookies for analytics and marketing purposes. You can opt-out of Google tracking through Google Ads Settings, Ad Settings for mobile apps, or any other available means. Google also provides a Google Analytics opt-out plug-in for the web.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">What is Do Not Track (DNT)?</h2>
              <p className="mb-4">
                DNT is a concept that has been promoted by regulatory agencies such as the U.S. Federal Trade Commission (FTC), for the Internet industry to develop and implement a mechanism for allowing Internet users to control the tracking of their online activities across websites by using browser settings. The World Wide Web Consortium (W3C) has been working with industry groups, Internet browsers, technology companies, and regulators to develop a DNT technology standard. While some progress has been made, it has been slow. No standard has been adopted to this date. As such, Trainn does not generally respond to "do not track" signals.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">How often will this Cookie Notice be updated?</h2>
              <p className="mb-4">
                We may update this Cookie Notice from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore revisit this Cookie Notice regularly to stay informed about our use of cookies and related technologies.
              </p>
              <p className="mb-4">
                The date at the top of this Cookie Notice indicates when it was last updated.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Where can I get further information?</h2>
              <p className="mb-4">
                If you have any questions about our use of cookies or other technologies, please contact us through Trainn's Contact Us page.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}