import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Map, Users, Star } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";

export default function LandingPages() {
  const landingPages = [
    {
      title: "Provider Landing Page",
      url: "/provider-landing",
      description: "Dedicated landing page for fitness providers to learn about Trainn's platform. Highlights free signup, easy management tools, promo codes, and SF Bay Area local support.",
      targetKeywords: ["fitness provider platform", "list fitness classes", "grow coaching business"],
      features: ["Provider-focused messaging", "Benefit highlights", "Conversion optimized"],
      status: "Live",
      category: "Provider"
    },
    {
      title: "Outdoor Workouts San Francisco",
      url: "/outdoor-workouts-san-francisco",
      description: "Discover outdoor fitness classes in San Francisco's best parks and outdoor locations. Featuring top-rated coaches and flexible scheduling.",
      targetKeywords: ["outdoor workout san francisco", "outdoor fitness classes", "park workouts sf"],
      features: ["Real provider profiles", "Location-based filtering", "SEO optimized"],
      status: "Live",
      category: "Fitness"
    },
    {
      title: "Kids Drop-In Sports Classes San Francisco",
      url: "/kids-drop-in-sports-classes-san-francisco",
      description: "Drop-in sports classes for kids in San Francisco. Soccer, basketball, and multi-sport programs with expert youth coaches. Ages 3-17 welcome.",
      targetKeywords: ["kids sports classes san francisco", "drop in sports kids", "youth soccer sf", "kids basketball classes"],
      features: ["Youth sports specialists", "No commitments required", "FAQ schema", "Age group filtering"],
      status: "Live",
      category: "Kids Sports"
    },
    {
      title: "Kids After School & Weekend Activities San Francisco",
      url: "/kids-after-school-activities-san-francisco",
      description: "After school and weekend drop-in activities for kids in San Francisco. Sports, creative arts, music and more with flexible scheduling. Ages 3-17 welcome.",
      targetKeywords: ["kids after school activities san francisco", "weekend activities kids", "drop in activities kids sf", "creative classes kids"],
      features: ["After school timing", "Weekend options", "Creative & sports mix", "Drop-in flexibility"],
      status: "Live",
      category: "Kids Activities"
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Trainn Landing Pages
            </h1>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                SEO Optimized
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Mobile Responsive
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Conversion Focused
              </Badge>
            </div>
          </div>
        </section>

        {/* Landing Pages Grid */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Active Landing Pages</h2>
              <p className="text-lg text-gray-600">
                Each page is optimized for specific search terms and user intent
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {landingPages.map((page, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={page.status === 'Live' ? 'default' : 'secondary'}>
                        {page.status}
                      </Badge>
                      <Badge variant="outline">{page.category}</Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{page.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {page.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Target Keywords */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Target Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {page.targetKeywords.map((keyword, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>



                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={page.url}>
                          <Button variant="default" size="sm" className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View Page
                          </Button>
                        </Link>
                        {page.title !== "Outdoor Workouts San Francisco" && page.title !== "Kids Drop-In Sports Classes San Francisco" && page.title !== "Kids After School & Weekend Activities San Francisco" && (
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Map className="w-4 h-4" />
                            Analytics
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Coming Soon Section */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
              <p className="text-gray-600 mb-8">More targeted landing pages are in development</p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  "Outdoor Yoga San Francisco", 
                  "Personal Trainers San Francisco",
                  "Kids Soccer Classes San Francisco"
                ].map((title, index) => (
                  <Card key={index} className="opacity-60">
                    <CardContent className="p-4 text-center">
                      <Badge variant="secondary" className="mb-2">Coming Soon</Badge>
                      <h4 className="font-semibold text-sm">{title}</h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            
          </div>
        </section>
      </div>
      <Footer />
      <MobileNavigation />
    </>
  );
}