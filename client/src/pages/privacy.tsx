import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}