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

// Provider Highlights Component with real profile pictures
const ProviderHighlights = () => {
  const targetCoachIds = [16, 1, 175, 13];
  
  // Fetch all coaches data
  const { data: coaches } = useQuery({
    queryKey: ['/api/coaches'],
    select: (data: any[]) => data.filter(coach => targetCoachIds.includes(coach.id))
  });

  const providerProfiles = [
    { id: 16, name: "Pablo Soccer Academy", specialty: "Youth Soccer & Skills Development", initials: "PS", gradient: "from-green-500 to-blue-600" },
    { id: 1, name: "Coach Matt Fitness", specialty: "Youth Basketball & Athletics", initials: "CM", gradient: "from-orange-500 to-red-600" },
    { id: 175, name: "Elite Sports Training", specialty: "Multi-Sport Development", initials: "ES", gradient: "from-purple-500 to-pink-600" },
    { id: 13, name: "Active Kids Sports", specialty: "Foundation Sports Skills", initials: "AK", gradient: "from-blue-500 to-cyan-600" }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          src={classItem.image || "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"}
          alt={classItem.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500") {
              target.src = "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500";
            }
          }}
        />
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-blue-500 text-white text-sm font-medium px-2 py-1 rounded">
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
              {coach ? 
                ((coach as any).displayBusinessName && (coach as any).businessName ? 
                  (coach as any).businessName : 
                  `${(coach as any).firstName} ${(coach as any).lastName}`
                ) : 
                "Coach"
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function KidsDropInSportsSF() {
  // Fetch classes with enhanced filtering for kids sports classes by target providers
  const { data: classes, isLoading } = useQuery({
    queryKey: ['/api/classes'],
    select: (data: any[]) => {
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 8); // Include the 7th day
      
      // Target providers with kids sports classes
      const targetCoachIds = [16, 1, 175, 13];
      
      // Sports-related category IDs (based on typical sports categories)
      const sportsCategories = [6, 5, 3, 4, 7, 8]; // Soccer, Basketball, Strength & Conditioning, Cardio, etc.
      
      // First filter by basic criteria: kids sports classes from target providers in SF
      const eligibleClasses = data.filter(cls => {
        // Must be from target providers
        if (!targetCoachIds.includes(cls.coachId)) return false;
        
        // Must be in San Francisco
        if (cls.city !== 'San Francisco') return false;
        
        // Must be for kids age group
        if (cls.ageGroup !== 'Kids') return false;
        
        // Prefer sports-related categories but don't exclude others
        // This allows for flexibility while prioritizing sports
        
        // Must be within next 7 days (inclusive)
        if (cls.startTime) {
          const classDate = new Date(cls.startTime);
          if (classDate < now || classDate >= sevenDaysFromNow) return false;
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

      // Step 1: Get exactly 1 class from each of the 4 providers (if they have kids classes)
      targetCoachIds.forEach(coachId => {
        const coachClasses = classesByCoach.get(coachId);
        if (coachClasses && coachClasses.length > 0) {
          // Take the earliest upcoming kids class from this provider
          const earliestClass = coachClasses[0];
          selectedClasses.push(earliestClass);
          usedClassIds.add(earliestClass.id);
        }
      });

      // Step 2: Add additional classes from the remaining pool to reach 8-9 classes
      const remainingClasses = sortedClasses.filter(cls => !usedClassIds.has(cls.id));
      
      // Add up to 5 more classes to reach target of 8-9 total
      for (let i = 0; i < Math.min(5, remainingClasses.length); i++) {
        selectedClasses.push(remainingClasses[i]);
        usedClassIds.add(remainingClasses[i].id);
      }

      return selectedClasses;
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
        <title>Kids Drop-In Sports Classes San Francisco | Youth Soccer, Basketball & More | Trainn</title>
        <meta name="description" content="Drop-in sports classes for kids in San Francisco. Soccer, basketball, and multi-sport programs. No long-term commitments required. Ages 3-17 welcome." />
        <meta name="keywords" content="kids sports classes San Francisco, drop in sports kids, youth soccer SF, kids basketball classes, children sports programs San Francisco, no commitment kids sports" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Kids Drop-In Sports Classes San Francisco | Book Youth Sports" />
        <meta property="og:description" content="Find drop-in sports classes for kids in San Francisco. Soccer, basketball, and athletics programs with flexible scheduling." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainn.pro/kids-drop-in-sports-classes-san-francisco" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kids Drop-In Sports Classes San Francisco" />
        <meta name="twitter:description" content="Find drop-in sports classes for kids in SF with flexible scheduling" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
              "@type": "Question",
              "name": "How much are drop-in sports classes for kids in San Francisco?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Kids drop-in sports classes in San Francisco range from $25-40 per session. No long-term commitments or seasonal registration required. Many coaches offer package discounts for multiple sessions."
              }
            }, {
              "@type": "Question",
              "name": "What age groups are available for kids sports classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Kids sports classes are available for ages 3-17, typically grouped as: Little Athletes (3-5), Elementary (6-9), Middle School (10-13), and High School (14-17). Each class is designed for age-appropriate skill development."
              }
            }, {
              "@type": "Question", 
              "name": "What sports are offered for kids in San Francisco?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer soccer, basketball, tennis, martial arts, swimming, track and field, and multi-sport programs. Classes focus on fundamental skills, teamwork, and fun in a supportive environment."
              }
            }, {
              "@type": "Question",
              "name": "Do kids need prior experience to join drop-in sports classes?", 
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No prior experience required! Most classes welcome beginners and focus on teaching fundamental skills. Coaches provide instruction suitable for all skill levels within the age group."
              }
            }, {
              "@type": "Question",
              "name": "What should kids bring to sports classes?",
              "acceptedAnswer": {
                "@type": "Answer", 
                "text": "Kids should bring water bottle, appropriate athletic clothing, and sport-specific equipment if they have it. Many coaches provide basic equipment for beginners. Check class descriptions for specific requirements."
              }
            }, {
              "@type": "Question",
              "name": "Are parents required to stay during kids sports classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Parent supervision requirements vary by age group and coach. Generally, parents of children under 6 should stay nearby, while older kids can participate independently. Check with your specific coach for their policy."
              }
            }, {
              "@type": "Question",
              "name": "How do I book a drop-in sports class for my child?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Simply browse available classes, select your child's age-appropriate session, and complete booking online. Payment is processed securely, and you'll receive confirmation with location details and what to bring."
              }
            }, {
              "@type": "Question",
              "name": "What happens if my child doesn't enjoy the sports class?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Since these are drop-in classes with no long-term commitment, you can try different sports and coaches to find the best fit. Most coaches focus on making sports fun and building confidence for all participants."
              }
            }]
          })}
        </script>
      </Helmet>

      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Kids Drop-In Sports Classes in San Francisco
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                No commitments, just fun! Soccer, basketball, and more sports for kids ages 3-17
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  Upper Noe Recreation
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  Mission Playground
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="w-4 h-4 mr-1" />
                  Balboa Park
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Ages 3-17
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Classes Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Upcoming Kids Sports Classes
              </h2>
              <p className="text-xl text-gray-600">
                Drop-in friendly classes with expert youth coaches
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
                  No kids sports classes scheduled this week
                </h3>
                <p className="text-gray-500 mb-6">
                  Check back soon for new classes or browse all available options
                </p>
                <Link href="/classes?ageGroup=Kids">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    View All Kids Classes
                  </Button>
                </Link>
              </div>
            )}

            {classes && classes.length > 0 && (
              <div className="text-center mt-12">
                <Link href="/classes?ageGroup=Kids">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    View All Kids Classes
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Featured Coaches Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Expert Youth Sports Coaches
              </h2>
              <p className="text-xl text-gray-600">
                Experienced coaches specializing in youth development and fun
              </p>
            </div>
            <ProviderHighlights />
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Drop-In Kids Sports?
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center p-6">
                <CardHeader>
                  <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle>No Commitments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Book individual sessions without seasonal registration or long-term contracts.</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6">
                <CardHeader>
                  <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <CardTitle>All Skill Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Beginner-friendly classes that build confidence and fundamental skills.</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6">
                <CardHeader>
                  <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle>Affordable Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Pay per session starting at $25, much less than traditional sports leagues.</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6">
                <CardHeader>
                  <Heart className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <CardTitle>Fun-Focused</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Emphasis on enjoyment, teamwork, and building a lifelong love of sports.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Popular Kids Sports Locations
              </h2>
              <p className="text-xl text-gray-600">
                Safe, fun venues across San Francisco perfect for youth sports
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">Upper Noe Recreation Center</h3>
                <p className="text-gray-600 text-sm">Full-size soccer field, basketball courts, and indoor facilities</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">Mission Playground</h3>
                <p className="text-gray-600 text-sm">Multi-sport courts and open fields for various activities</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">Balboa Park</h3>
                <p className="text-gray-600 text-sm">Large open spaces perfect for running and team sports</p>
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