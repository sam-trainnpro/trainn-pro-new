import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DMCAPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">DMCA Policy</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Digital Millennium Copyright Act (DMCA) Notice</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="mb-6">
                Trainn respects the intellectual property rights of others and expects our users to do the same. 
                In accordance with the Digital Millennium Copyright Act of 1998 (DMCA), we will respond expeditiously 
                to claims of copyright infringement committed using our service.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Filing a DMCA Notice</h2>
              
              <p className="mb-4">
                If you believe that content on our platform infringes your copyright, you may submit a DMCA takedown notice. 
                Your notice must include the following information:
              </p>

              <div className="ml-8 mb-6">
                <p className="mb-2">
                  <strong>1. Identification of the copyrighted work</strong> that you claim has been infringed, 
                  or if multiple copyrighted works are covered by a single notification, a representative list of such works.
                </p>
                
                <p className="mb-2">
                  <strong>2. Identification of the material</strong> that is claimed to be infringing and that is to be removed 
                  or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material.
                </p>
                
                <p className="mb-2">
                  <strong>3. Information reasonably sufficient</strong> to permit us to contact the complaining party, 
                  such as an address, telephone number, and email address.
                </p>
                
                <p className="mb-2">
                  <strong>4. A statement</strong> that the complaining party has a good faith belief that use of the material 
                  in the manner complained of is not authorized by the copyright owner, its agent, or the law.
                </p>
                
                <p className="mb-2">
                  <strong>5. A statement</strong> that the information in the notification is accurate, and under penalty of perjury, 
                  that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
                </p>
                
                <p className="mb-2">
                  <strong>6. A physical or electronic signature</strong> of a person authorized to act on behalf of the owner 
                  of an exclusive right that is allegedly infringed.
                </p>
              </div>

              <h2 className="text-xl font-semibold mt-8 mb-4">How to Submit a DMCA Notice</h2>
              
              <p className="mb-4">
                Please send your DMCA notice to our designated agent:
              </p>

              <div className="ml-8 mb-6 bg-gray-50 p-4 rounded-lg">
                <p><strong>DMCA Agent:</strong> Legal Department</p>
                <p><strong>Email:</strong> <a href="mailto:dmca@trainn.pro" className="text-blue-600 hover:underline">dmca@trainn.pro</a></p>
                <p><strong>Address:</strong><br />
                  Trainn, Inc.<br />
                  DMCA Complaints<br />
                  San Francisco, CA 94102<br />
                  United States
                </p>
              </div>

              <h2 className="text-xl font-semibold mt-8 mb-4">Counter-Notification</h2>
              
              <p className="mb-4">
                If you believe that your content was removed or disabled by mistake or misidentification, 
                you may submit a counter-notification. Your counter-notification must include:
              </p>

              <div className="ml-8 mb-6">
                <p className="mb-2">
                  <strong>1. Your physical or electronic signature.</strong>
                </p>
                
                <p className="mb-2">
                  <strong>2. Identification of the material</strong> that has been removed or to which access has been disabled, 
                  and the location at which the material appeared before it was removed or access to it was disabled.
                </p>
                
                <p className="mb-2">
                  <strong>3. A statement under penalty of perjury</strong> that you have a good faith belief that the material 
                  was removed or disabled as a result of mistake or misidentification.
                </p>
                
                <p className="mb-2">
                  <strong>4. Your name, address, and telephone number,</strong> and a statement that you consent to the jurisdiction 
                  of the Federal District Court for the judicial district in which your address is located, or if your address is 
                  outside of the United States, for any judicial district in which Trainn may be found, and that you will accept 
                  service of process from the person who provided the original DMCA notification or an agent of such person.
                </p>
              </div>

              <h2 className="text-xl font-semibold mt-8 mb-4">Repeat Infringer Policy</h2>
              
              <p className="mb-4">
                Trainn has adopted a policy of terminating, in appropriate circumstances and at our sole discretion, 
                the accounts of users who are deemed to be repeat infringers. We may also limit access to our service 
                and/or terminate the accounts of users who infringe any intellectual property rights of others, 
                whether or not there is any repeat infringement.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">False Claims</h2>
              
              <p className="mb-4">
                Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents 
                that material or activity is infringing may be subject to liability for damages. We reserve the right 
                to seek damages from any party that submits a false DMCA notification or counter-notification.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Contact Information</h2>
              
              <p className="mb-4">
                For questions regarding this DMCA policy, please contact us at:
              </p>

              <div className="ml-8 mb-6">
                <p><strong>Email:</strong> <a href="mailto:legal@trainn.pro" className="text-blue-600 hover:underline">legal@trainn.pro</a></p>
                <p><strong>Website:</strong> <a href="https://trainn.pro" className="text-blue-600 hover:underline">https://trainn.pro</a></p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  This DMCA policy is effective as of January 2025 and may be updated from time to time. 
                  Please check this page periodically for any changes.
                </p>
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