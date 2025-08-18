import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, DollarSign, Star, Heart, Clock, Palette, Music, Zap } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";

// Provider Highlights Component with kids activity providers including Alexei
const ProviderHighlights = () => {
  const targetCoachIds = [16, 1, 175, 61]; // Pat, Sam, Ryan, and Alexei Wajchman
  
  // Fetch all coaches data
  const { data: coaches } = useQuery({
    queryKey: ['/api/coaches'],
    select: (data: any[]) => data.filter(coach => targetCoachIds.includes(coach.id))
  });

  const providerProfiles = [
    { id: 16, name: "Pat Balderramos", specialty: "Youth Soccer", initials: "PB", gradient: "from-green-500 to-blue-600" },
    { id: 1, name: "Sam Roth", specialty: "Youth Basketball", initials: "SR", gradient: "from-orange-500 to-red-600" },
    { id: 175, name: "Ryan Zoradi", specialty: "Youth Soccer", initials: "RZ", gradient: "from-purple-500 to-pink-600" },
    { id: 61, name: "Alexei Wajchman", specialty: "Creative Activities", initials: "AW", gradient: "from-blue-500 to-cyan-600" }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {providerProfiles.map((profile) => {
        const coach = coaches?.find(c => c.id === profile.id);
        
        // Fetch rating stats for each coach
        const { data: ratingStats } = useQuery({
          queryKey: ['/api/reviews/coach', profile.id, 'stats'],
          queryFn: () => fetch(`/api/reviews/coach/${profile.id}/stats`).then(res => res.json()),
        });

        const displayRating = ratingStats?.totalReviews > 0 ? ratingStats.averageRating.toFixed(1) : "New";
        
        return (
          <div key={profile.id} className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition">
            <div className={`w-16 h-16 bg-gradient-to-br ${profile.gradient} rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden`}>
              {coach?.profileImage ? (
                <img 
                  src={coach.profileImage} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">{profile.initials}</span>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {coach?.businessName && coach?.showBusinessName ? coach.businessName : profile.name}
            </h3>
            <p className="text-gray-600 text-sm mb-2">{profile.specialty}</p>
            <div className="flex items-center justify-center text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 text-sm font-medium text-gray-700">{displayRating}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
          src={classItem.image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"}
          alt={classItem.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500") {
              target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500";
            }
          }}
        />
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-purple-500 text-white text-sm font-medium px-2 py-1 rounded">
          {(category as any)?.name || "Activity"}
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
              {coach ? 
                ((coach as any).displayBusinessName && (coach as any).businessName ? 
                  (coach as any).businessName : 
                  `${(coach as any).firstName} ${(coach as any).lastName}`
                ) : 
                "Provider"
              }
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
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function KidsAfterSchoolActivitiesSF() {
  // Fetch classes with enhanced filtering for kids activities by target providers
  const { data: classes, isLoading } = useQuery({
    queryKey: ['/api/classes'],
    select: (data: any[]) => {
      const now = new Date();
      const futureLimit = new Date();
      futureLimit.setDate(now.getDate() + 30); // Include classes up to 30 days in the future
      
      // Target providers with kids activities - including Alexei for creative activities
      const targetCoachIds = [16, 1, 175, 61]; // Pat, Sam, Ryan, Alexei
      
      // First filter by basic criteria: kids activities from target providers in SF
      const eligibleClasses = data.filter(cls => {
        // Must be from target providers
        if (!targetCoachIds.includes(cls.coachId)) return false;
        
        // Must be in San Francisco
        if (cls.city !== 'San Francisco') return false;
        
        // Must be for kids age group
        if (cls.ageGroup !== 'Kids') return false;
        
        // Must be within next 30 days (inclusive)
        if (cls.startTime) {
          const classDate = new Date(cls.startTime);
          if (classDate < now || classDate >= futureLimit) return false;
        }
        
        return true;
      });

      // Sort by start time (upcoming first)
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

      const selectedClasses: any[] = [];
      const usedClassIds = new Set();

      // Get classes from each featured coach
      targetCoachIds.forEach(coachId => {
        const coachClasses = classesByCoach.get(coachId);
        if (coachClasses && coachClasses.length > 0) {
          // Take up to 2 earliest upcoming kids classes from this provider
          const classesToAdd = coachClasses.slice(0, 2);
          classesToAdd.forEach((cls: any) => {
            selectedClasses.push(cls);
            usedClassIds.add(cls.id);
          });
        }
      });

      return selectedClasses;
    }
  });

  return (
    <>
      <Helmet>
        <title>Kids After School & Weekend Activities San Francisco | Drop-In Programs | Trainn</title>
        <meta name="description" content="Find after school and weekend drop-in activities for kids in San Francisco. Sports, creative arts, music and more. Flexible scheduling, expert instructors. Ages 3-17 welcome." />
        <meta name="keywords" content="kids after school activities San Francisco, weekend activities kids, drop in activities kids SF, creative classes kids, youth programs San Francisco" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Kids After School & Weekend Activities San Francisco | Drop-In Programs" />
        <meta property="og:description" content="Find after school and weekend drop-in activities for kids in San Francisco. Sports, creative arts, music and more with flexible scheduling." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainn.pro/kids-after-school-activities-san-francisco" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kids After School & Weekend Activities San Francisco" />
        <meta name="twitter:description" content="Find after school and weekend drop-in activities for kids in SF" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
              "@type": "Question",
              "name": "What types of after school activities are available for kids in San Francisco?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer sports (soccer, basketball), creative arts, music lessons, STEM activities, and multi-activity programs. All designed for after school and weekend scheduling with flexible drop-in options."
              }
            }, {
              "@type": "Question",
              "name": "How much do kids after school activities cost in San Francisco?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Kids after school and weekend activities range from $25-45 per session. No long-term commitments required - perfect for busy families who need flexible scheduling."
              }
            }, {
              "@type": "Question",
              "name": "What age groups are available for after school activities?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "After school activities are available for ages 3-17, with age-appropriate groupings: Preschool (3-5), Elementary (6-9), Middle School (10-13), and High School (14-17)."
              }
            }, {
              "@type": "Question",
              "name": "Are drop-in activities available for kids after school?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! All our activities offer drop-in flexibility - perfect for busy families. No seasonal commitments or long-term registrations required. Book individual sessions as needed."
              }
            }, {
              "@type": "Question",
              "name": "What should kids bring to after school activities?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Kids should bring water, comfortable clothes for movement, and any specific materials mentioned in the activity description. Most instructors provide basic equipment and supplies."
              }
            }]
          })}
        </script>
      </Helmet>

      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-600 to-pink-600 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Kids After School & Weekend Activities in San Francisco
              </h1>
              <p className="text-xl md:text-2xl mb-8 leading-relaxed max-w-3xl mx-auto">
                Discover engaging drop-in activities perfect for after school and weekends. From sports to creative arts, 
                give your kids fun and enriching experiences with flexible scheduling.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Calendar className="w-4 h-4 mr-1" />
                  After School & Weekends
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Zap className="w-4 h-4 mr-1" />
                  Drop-In Friendly
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Heart className="w-4 h-4 mr-1" />
                  Ages 3-17
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  San Francisco
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Kids After School & Weekend Activities in San Francisco?
              </h2>
              <p className="text-xl text-gray-600">
                Perfect for busy families who need flexible, enriching activities for their children
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center p-6 hover:shadow-lg transition">
                <CardHeader>
                  <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>After School Perfect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Convenient timing that works with school schedules and busy family life.</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition">
                <CardHeader>
                  <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>Drop-In Flexibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">No long-term commitments. Book sessions when it works for your schedule.</p>
                </CardContent>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition">
                <CardHeader>
                  <Palette className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>Diverse Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Sports, arts, music, and creative programs to discover your child's passion.</p>
                </CardContent>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition">
                <CardHeader>
                  <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>Expert Instructors</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Qualified providers specializing in youth development and engagement.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Activities Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Upcoming Kids Activities in SF
              </h2>
              <p className="text-xl text-gray-600">
                Perfect after school and weekend programs with flexible drop-in options
              </p>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {classes.map((classItem) => (
                  <ClassCard key={classItem.id} classItem={classItem} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold text-gray-600 mb-4">
                  No kids activities scheduled this week
                </h3>
                <p className="text-gray-500 mb-6">
                  Check back soon for new activities or browse all available options
                </p>
                <Link href="/classes?ageGroup=Kids">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    View All Kids Activities
                  </Button>
                </Link>
              </div>
            )}

            {classes && classes.length > 0 && (
              <div className="text-center mt-12">
                <Link href="/classes?ageGroup=Kids">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    View All Kids Activities
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Featured Providers Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Kids Activity Providers
              </h2>
              <p className="text-xl text-gray-600">
                Experienced instructors specializing in youth activities and development
              </p>
            </div>
            <ProviderHighlights />
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Book Kids Activities with Trainn?
            </h2>
            <p className="text-xl mb-8">
              Give your kids enriching after school and weekend experiences with the flexibility your family needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/classes?ageGroup=Kids">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3">
                  Browse Classes
                </Button>
              </Link>
              <Link href="/coaches">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3">
                  View Providers
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