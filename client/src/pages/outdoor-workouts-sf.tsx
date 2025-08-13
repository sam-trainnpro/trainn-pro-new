import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, DollarSign, Star, Heart, Clock } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";

// Enhanced ClassCard component matching the design
const ClassCard = ({ classItem }: { classItem: any }) => {
  // Fetch coach data
  const { data: coach } = useQuery({
    queryKey: [`/api/coaches/${classItem.coachId}`],
  });

  // Fetch category data
  const { data: category } = useQuery({
    queryKey: [`/api/categories/${classItem.categoryId}`],
  });

  // Fetch booking count data
  const { data: bookingCount } = useQuery<{
    total: number;
    active: number;
    totalSpotsBooked: number;
    capacity: number;
    spotsLeft: number;
  }>({
    queryKey: [`/api/classes/${classItem.id}/bookings/count`],
  });

  // Get rating statistics for the coach
  const { data: coachRatingStats } = useQuery({
    queryKey: ['/api/reviews/coach', classItem.coachId, 'stats'],
    queryFn: () => fetch(`/api/reviews/coach/${classItem.coachId}/stats`).then(res => res.json()),
    enabled: !!classItem.coachId,
  });

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price}`;
  };

  const formatClassTime = () => {
    if (!classItem.startTime || !classItem.endTime) {
      return 'Schedule not available';
    }
    
    const startDate = new Date(classItem.startTime);
    const endDate = new Date(classItem.endTime);
    
    const dayOfWeek = startDate.toLocaleDateString('en-US', { weekday: 'short' });
    const month = startDate.getMonth() + 1;
    const day = startDate.getDate();
    const formattedDate = `${dayOfWeek} ${month}/${day}`;
    
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${formattedDate} ${startTime} - ${endTime} PT`;
  };

  const spotsLeft = bookingCount ? bookingCount.spotsLeft : classItem.capacity;
  const hasRealReviews = coachRatingStats && coachRatingStats.totalReviews > 0 && coachRatingStats.averageRating > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={classItem.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"}
          alt={classItem.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500") {
              target.src = "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500";
            }
          }}
        />
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-medium px-2 py-1 rounded">
          {(category as any)?.name || "Class"}
        </div>
      </div>
      
      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{classItem.title}</h3>
          <span className="text-xl font-bold text-gray-900">{formatPrice(classItem.price)}</span>
        </div>
        
        {/* Location */}
        <div className="flex items-center mb-2 text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm line-clamp-1">{classItem.location}</span>
        </div>
        
        {/* Time */}
        <div className="flex items-center mb-4 text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span className="text-sm">{formatClassTime()}</span>
        </div>
        
        {/* Coach Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-200 flex items-center justify-center">
              {(coach as any)?.profileImage ? (
                <img 
                  src={(coach as any).profileImage} 
                  alt={(coach as any).firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {coach ? `${(coach as any).firstName}` : "Coach"}
            </span>
          </div>
          
          {hasRealReviews && (
            <div className="flex items-center">
              <Star className="text-yellow-400 fill-yellow-400 h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{coachRatingStats.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        {/* Spots Left and Book Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {spotsLeft}/{classItem.capacity} spots left
          </span>
          
          <Link href={`/classes/${classItem.id}`}>
            <Button 
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function OutdoorWorkoutsSF() {
  // Fetch classes with filters for outdoor workouts by main adult-focused providers
  const { data: classes, isLoading } = useQuery({
    queryKey: ['/api/classes'],
    select: (data: any[]) => {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      
      // First filter by basic criteria
      const eligibleClasses = data.filter(cls => {
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
      });

      // Sort by start time (upcoming classes first)
      const sortedClasses = eligibleClasses.sort((a, b) => {
        const dateA = new Date(a.startTime || '9999-12-31');
        const dateB = new Date(b.startTime || '9999-12-31');
        return dateA.getTime() - dateB.getTime();
      });

      // Group classes by coach ID
      const classesByCoach = new Map();
      sortedClasses.forEach(cls => {
        if (!classesByCoach.has(cls.coachId)) {
          classesByCoach.set(cls.coachId, []);
        }
        classesByCoach.get(cls.coachId).push(cls);
      });

      const targetCoachIds = [22, 55, 44, 69, 146, 167, 54];
      const selectedClasses: any[] = [];

      // First, get at least 1 class from each coach (if available)
      targetCoachIds.forEach(coachId => {
        const coachClasses = classesByCoach.get(coachId);
        if (coachClasses && coachClasses.length > 0) {
          selectedClasses.push(coachClasses[0]); // Take the earliest upcoming class
        }
      });

      // Fill remaining slots (up to 9 total) with additional classes from coaches who have extras
      // Prioritize classes happening tomorrow or the day after
      const remainingSlots = 9 - selectedClasses.length;
      const usedClassIds = new Set(selectedClasses.map((cls: any) => cls.id));
      
      for (let i = 0; i < remainingSlots && selectedClasses.length < 9; i++) {
        let bestClass = null;
        let bestScore = -1;
        
        // Look through all remaining classes to find the best candidates
        sortedClasses.forEach(cls => {
          if (usedClassIds.has(cls.id)) return;
          
          const classDate = new Date(cls.startTime);
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          const dayAfterTomorrow = new Date(now);
          dayAfterTomorrow.setDate(now.getDate() + 2);
          
          // Score classes: higher score = better priority
          let score = 0;
          
          // Prioritize classes happening tomorrow or day after
          if (classDate >= tomorrow && classDate < dayAfterTomorrow) {
            score += 100; // Tomorrow gets highest priority
          } else if (classDate >= dayAfterTomorrow) {
            const dayAfterEnd = new Date(dayAfterTomorrow);
            dayAfterEnd.setDate(dayAfterTomorrow.getDate() + 1);
            if (classDate < dayAfterEnd) {
              score += 50; // Day after tomorrow gets medium priority
            }
          }
          
          // Prefer coaches who have multiple classes (shows they're active)
          const coachClassCount = classesByCoach.get(cls.coachId)?.length || 0;
          if (coachClassCount > 1) {
            score += coachClassCount * 5;
          }
          
          // Prefer earlier times within the same day
          score -= (classDate.getTime() - now.getTime()) / (1000 * 60 * 60); // Subtract hours from now
          
          if (score > bestScore) {
            bestScore = score;
            bestClass = cls;
          }
        });
        
        if (bestClass) {
          selectedClasses.push(bestClass);
          usedClassIds.add((bestClass as any).id);
        }
      }

      return selectedClasses.slice(0, 9);
    }
  });

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
        <title>Outdoor Workouts in San Francisco | Group Fitness Classes in Parks | Trainn</title>
        <meta name="description" content="Join outdoor workout classes in San Francisco's best parks. From HIIT bootcamps at Dolores Park to strength training at Bayfront Park. Book drop-in sessions starting at $15." />
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
                Outdoor Fitness Classes in San Francisco
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

        {/* Provider Highlights Section */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Featured Outdoor Fitness Providers</h2>
            <p className="text-lg text-gray-600 text-center mb-12">
              Top-rated trainers and fitness professionals bringing outdoor workouts to San Francisco
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Richard Seto Coaching */}
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">RS</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">Richard Seto Coaching</h3>
                <p className="text-gray-600 text-sm mb-2">HYROX & Strength Training</p>
                <div className="flex items-center justify-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">5.0</span>
                </div>
              </div>

              {/* The City is Our Gym */}
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">TC</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">The City is Our Gym</h3>
                <p className="text-gray-600 text-sm mb-2">Urban Fitness & HIIT</p>
                <div className="flex items-center justify-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">5.0</span>
                </div>
              </div>

              {/* Tuff as Neils */}
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">TN</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">Tuff as Neils</h3>
                <p className="text-gray-600 text-sm mb-2">Personal Training</p>
                <div className="flex items-center justify-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">5.0</span>
                </div>
              </div>

              {/* Outdoor Yoga SF */}
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">OY</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">Outdoor Yoga SF</h3>
                <p className="text-gray-600 text-sm mb-2">Outdoor Yoga & Mindfulness</p>
                <div className="flex items-center justify-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">New</span>
                </div>
              </div>

              {/* Workout on the Hill */}
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">WH</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">Workout on the Hill</h3>
                <p className="text-gray-600 text-sm mb-2">Hill Training & Conditioning</p>
                <div className="flex items-center justify-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">New</span>
                </div>
              </div>

              {/* Movement Coach Lea */}
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">ML</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">Movement Coach Lea</h3>
                <p className="text-gray-600 text-sm mb-2">Functional Movement</p>
                <div className="flex items-center justify-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">4.8</span>
                </div>
              </div>

              {/* Independent Trainers */}
              <div className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">SF</span>
                </div>
                <h3 className="font-semibold text-lg mb-1">SF Outdoor Trainers</h3>
                <p className="text-gray-600 text-sm mb-2">Various Specialties</p>
                <div className="flex items-center justify-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm font-medium text-gray-700">5.0</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">All providers are vetted professionals with insurance and certifications</p>
              <Link href="/coaches">
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                  View All Providers
                </Button>
              </Link>
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
                {classes.map((cls: any) => <ClassCard key={cls.id} classItem={cls} />)}
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
            <h2 className="text-3xl font-bold mb-4">Ready to Workout Outdoors with Trainn?</h2>
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