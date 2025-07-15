import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommunityGuidelinesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Community Guidelines</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Building a Positive Community Together</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p className="mb-6">
                Trainn's mission is to help people enrich their lives by building new skills and having more fun through local classes and community. The Trainn community is local in all the cities in which we operate. This local community makes Trainn special. As Trainn members ask questions, leave reviews, express their point of view or simply interact with one another on our various channels, we encourage our community to be open, honest, and authentic. To foster a fun, encouraging, and inspiring community, we have created these guidelines.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Our community guidelines</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">True to Yourself</h3>
                  <p className="mb-4">
                    Tell your actual story. Don't mislead. If you're providing feedback, remember that what's most helpful is what's factual. Do not exaggerate.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Respect and empathy for others</h3>
                  <p className="mb-4">
                    Let's foster a positive community. Avoid making it personal by directly insulting, bullying or attacking others. Keep messaging constructive and provide supporting examples.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Appropriate content</h3>
                  <p className="mb-4">
                    Content and reviews that are offensive, contain profanity, are inappropriate or harmful may be removed. Threats, lewdness, harassment, hate speech, content targeting class members, instructors or staff to degrade, shame or insult them, and any personally identifiable information have no place in our community.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Promotional content and conflicts of interest</h3>
                  <p className="mb-4">
                    Promotional content will be removed, including external links and offers for other goods and other services. You shouldn't promote your own site or your own business, and when reviewing a class, avoid your own business or employee, your friends' or relatives' business, your peers or competitors or incentivizing customers to write reviews.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Original content</h3>
                  <p className="mb-4">
                    Post what's original to you. If you don't have permission to post it, don't. That simple. Avoid content taken from somewhere else, including anything that violates intellectual property rights.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Relevant</h3>
                  <p className="mb-4">
                    What you share should be relevant to our channel, customers and coaches. Avoid spamming, including deceptive and misleading content. When writing reviews, focus your contributions on your actual experience rather than comparisons with other classes or studios.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Please note that these guidelines are subject to change, but the most current version will always be available here.
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