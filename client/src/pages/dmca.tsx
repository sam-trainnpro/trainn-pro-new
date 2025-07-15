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
              <p className="text-sm text-gray-600 mb-6">
                Last Updated: June 2, 2025
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Notification of copyright infringement</h2>
              
              <p className="mb-4">
                If you are a copyright owner or an agent thereof, and you believe that any content hosted on the Site infringes your copyrights, you may submit a notification pursuant to the Digital Millennium Copyright Act ("DMCA") by providing our Designated Copyright Agent with the information listed in the below DMCA Notice in writing (see 17 U.S.C § 512(c)(3) for further detail). Upon receipt of the Notice as described below, Trainn will take whatever action, in its sole discretion, it deems appropriate, including removal of the challenged content from the Site.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">DMCA Notice of alleged infringement ("notice")</h2>
              
              <div className="ml-8 mb-6">
                <p className="mb-4">
                  <strong>1.</strong> Identify the copyrighted work that you claim has been infringed, or - if multiple copyrighted works are covered by this Notice - you may provide a representative list of the copyrighted works that you claim have been infringed.
                </p>
                
                <p className="mb-4">
                  <strong>2.</strong> Identify the material that you claim is infringing (or to be the subject of infringing activity) and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material, including at a minimum, if applicable, the URL of the link shown on the Site(s) where such material may be found.
                </p>
                
                <p className="mb-4">
                  <strong>3.</strong> Provide your mailing address, telephone number, and, if available, email address.
                </p>
                
                <p className="mb-4">
                  <strong>4.</strong> Include both of the following statements in the body of the Notice:
                </p>
                
                <div className="ml-8 mb-4">
                  <p className="mb-2">
                    "I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."
                  </p>
                  
                  <p className="mb-2">
                    "I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."
                  </p>
                </div>
                
                <p className="mb-4">
                  <strong>5.</strong> Provide your full legal name and your electronic or physical signature.
                </p>
                
                <p className="mb-4">
                  <strong>6.</strong> Deliver this Notice, with all items completed, to Trainn's Designated Copyright Agent:
                </p>
              </div>

              <div className="ml-8 mb-6 bg-gray-50 p-4 rounded-lg">
                <p><strong>DMCA Designated Agent</strong></p>
                <p>Mr. Roth d/b/a Trainn</p>
                <p>156 E 79th St</p>
                <p>New York, NY 10075</p>
                <p><strong>Email:</strong> <a href="mailto:support@trainn.pro" className="text-blue-600 hover:underline">support@trainn.pro</a></p>
              </div>

              <p className="mb-4">
                For clarity, only DMCA notices should go to the Copyright Agent. Any other feedback, comments, requests for technical support or other communications should be directed to Trainn customer service.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  );
}