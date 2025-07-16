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