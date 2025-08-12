import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, DollarSign } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";

export default function OutdoorWorkoutsSF() {
  // Fetch classes with filters for outdoor workouts by main adult-focused providers
  const { data: classes, isLoading } = useQuery({
    queryKey: ['/api/classes'],
    select: (data: any[]) => {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      
      return data.filter(cls => {
        // Filter by main adult-focused workout providers
        const targetCoachIds = [22, 55, 44, 69, 146, 167, 54];
        if (!targetCoachIds.includes(cls.coachId)) return false;
        
        // Filter by San Francisco
        if (cls.city !== 'San Francisco') return false;
        
        // Filter by outdoor classes (using the new outdoor field)
        if (!cls.outdoors) return false;
        
        // Filter by next 7 days
        if (cls.startTime) {
          const classDate = new Date(cls.startTime);
          if (classDate < now || classDate > sevenDaysFromNow) return false;
        }
        
        return true;
      }).slice(0, 9);
    }
  });

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recurring";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet>
        <title>Outdoor Workouts in San Francisco | Book Fitness Classes at Parks & Beaches</title>
        <meta name="description" content="Find outdoor fitness classes in San Francisco's best parks and beaches. Book yoga, HIIT, strength training, and personal training sessions at Dolores Park, Golden Gate Park, Crissy Field, and more." />
        <meta name="keywords" content="outdoor workouts San Francisco, park fitness classes, beach workouts SF, outdoor yoga San Francisco, Dolores Park fitness, Golden Gate Park classes, Crissy Field workouts" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Outdoor Workouts in San Francisco | Book Fitness Classes" />
        <meta property="og:description" content="Find outdoor fitness classes in San Francisco's best parks and beaches. Book yoga, HIIT, strength training, and personal training sessions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainn.pro/outdoor-workouts-san-francisco" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Outdoor Workouts in San Francisco" />
        <meta name="twitter:description" content="Find outdoor fitness classes in SF's best parks and beaches" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
              "@type": "Question", 
              "name": "What types of outdoor workouts are available in San Francisco?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer outdoor yoga, HIIT classes, strength training, personal training sessions, and cardio workouts at San Francisco's best parks and beaches including Dolores Park, Golden Gate Park, and Crissy Field."
              }
            }, {
              "@type": "Question",
              "name": "Do outdoor classes run in rain?", 
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most outdoor classes are weather-dependent. Coaches will notify participants of cancellations due to rain or unsafe conditions. Some covered areas may still allow classes during light rain."
              }
            }, {
              "@type": "Question",
              "name": "What should I bring to outdoor fitness classes?",
              "acceptedAnswer": {
                "@type": "Answer", 
                "text": "Bring a yoga mat, water bottle, towel, and wear weather-appropriate athletic clothing. Some classes may require specific equipment which will be listed in the class description."
              }
            }]
          })}
        </script>
      </Helmet>

      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-600 to-blue-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Outdoor Workouts in San Francisco
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100">
                Train at the city's most beautiful parks and beaches
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  Dolores Park
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  Golden Gate Park
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  Baker Beach
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  Marina Green
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Outdoor Fitness in SF?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Scenic Locations</h3>
                <p className="text-gray-600">Train with stunning views of the bay, city skyline, and iconic landmarks</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community Focused</h3>
                <p className="text-gray-600">Join like-minded fitness enthusiasts in San Francisco's outdoor community</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                <p className="text-gray-600">Drop-in classes and recurring sessions to fit your busy lifestyle</p>
              </div>
            </div>
          </div>
        </section>

        {/* Classes Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Available Outdoor Classes</h2>
            <p className="text-lg text-gray-600 text-center mb-12">
              Featuring top-rated coaches • Next 7 days • San Francisco outdoor locations
            </p>
            
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls: any) => (
                  <Link key={cls.id} href={`/class/${cls.id}`} className="block">
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer">
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={cls.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"}
                          alt={cls.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500") {
                              target.src = "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500";
                            }
                          }}
                        />
                        <div className="absolute top-3 left-3 bg-primary text-white text-sm font-medium px-2 py-1 rounded">
                          {formatPrice(cls.price)}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold line-clamp-2">{cls.title}</h3>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {cls.description}
                        </p>
                        
                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className="line-clamp-1">{cls.location}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formatDate(cls.startTime)}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            <span>Max {cls.capacity} participants</span>
                          </div>
                        </div>
                        
                        <Button className="w-full">
                          View Details & Book
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No outdoor classes currently available</h3>
                <p className="text-gray-600 mb-6">Check back soon or explore our full class catalog</p>
                <Link href="/classes">
                  <Button>View All Classes</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Train Outdoors?</h2>
            <p className="text-xl mb-8">Join San Francisco's outdoor fitness community today</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/classes">
                <Button size="lg" variant="secondary">
                  Browse All Classes
                </Button>
              </Link>
              <Link href="/coaches">
                <Button size="lg" variant="outline" className="text-green-600 bg-white border-white hover:bg-gray-100">
                  Find a Coach
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <MobileNavigation />
    </>
  );
}