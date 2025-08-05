import { useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Heart, Zap, Search, CalendarCheck, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>About Us - Trainn Fitness</title>
        <meta name="description" content="Learn about Trainn's mission to help people build new skills, get in shape, and build community through local outdoor sports, fitness, music and art classes." />
      </Helmet>
      
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            About Trainn
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Building stronger communities through fitness, creativity and play
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="mb-12">
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Trainn's leadership team is passionate about helping people build new skills, get in shape, and build community. We created Trainn to make it really simple to find and sign up for local outdoor workouts, sports classes, art, music, gym training sessions, and other fun activities for adults and kids.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  This platform empowers providers to grow their business and meet the needs of their community.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How It Works Section */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">How Trainn Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-primary h-6 w-6" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">Find Your Class</h3>
                <p className="text-gray-600">Search and filter through hundreds of classes by type, location, time, and age group to find the right adult or kids class.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck className="text-primary h-6 w-6" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">Book & Pay</h3>
                <p className="text-gray-600">Securely book and pay in just a few clicks. Receive instant confirmation and add to your calendar.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeartPulse className="text-primary h-6 w-6" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-2">Trainn & Review</h3>
                <p className="text-gray-600">Attend your class, achieve your goals, have fun, and leave a review to help others find great providers.</p>
              </div>
            </div>
            
            <div className="mt-10 text-center">
              <Link href="/classes">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
                  Start Your Fitness Journey
                </Button>
              </Link>
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
                <p className="text-sm text-gray-600">
                  Building connections through fun and shared experiences
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Simplicity</h3>
                <p className="text-sm text-gray-600">
                  Making it easy to find and book the perfect workout
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Wellness</h3>
                <p className="text-sm text-gray-600">
                  Offering classes that enrich the body and mind, fostering healthy lifestyles for people of all ages
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Empowerment</h3>
                <p className="text-sm text-gray-600">
                  Helping providers grow their business and impact
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="bg-primary text-white">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Join Our Community?
              </h2>
              <p className="text-lg mb-6 text-primary-foreground/90">
                Trainn is here for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/classes" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Find Classes
                </a>
                <a 
                  href="/auth?register=true&role=coach" 
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-primary transition-colors"
                >
                  Become a Provider
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}