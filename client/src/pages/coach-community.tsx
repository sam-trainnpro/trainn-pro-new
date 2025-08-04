import { Link } from "wouter";
import { ArrowLeft, Users, MessageCircle, Calendar, Trophy, Heart, Zap } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function CoachCommunity() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
            <span className="text-sm font-medium uppercase tracking-wide">Coming Soon</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Coach Community</h1>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto">
            Connect, collaborate, and grow with fellow coaches in the Bay Area's most supportive fitness community
          </p>
        </div>
      </div>

      {/* Content Preview */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">You're Never Alone</h2>
            <p className="text-lg text-gray-600">
              Join a thriving community of coaches who support each other's success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Discussion Forums</h3>
              </div>
              <p className="text-gray-600">
                Share experiences, ask questions, and get advice from experienced coaches across all disciplines
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Calendar className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Networking Events</h3>
              </div>
              <p className="text-gray-600">
                Monthly meetups, workshops, and social events to connect with local coaches in person
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Mentorship Program</h3>
              </div>
              <p className="text-gray-600">
                Get paired with successful coaches for guidance, or become a mentor to help newcomers succeed
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Recognition & Awards</h3>
              </div>
              <p className="text-gray-600">
                Celebrate achievements with monthly coach spotlights and annual community awards
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Support Network</h3>
              </div>
              <p className="text-gray-600">
                Access to wellness resources, mental health support, and peer assistance programs
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Collaboration Hub</h3>
              </div>
              <p className="text-gray-600">
                Partner with other coaches for joint classes, events, and cross-promotional opportunities
              </p>
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-8 mt-12 text-white">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">A Growing Community</h3>
              <p className="text-teal-100">What our coach community looks like today</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">150+</div>
                <div className="text-sm text-teal-100">Active Coaches</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">25+</div>
                <div className="text-sm text-teal-100">Specialties</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">12</div>
                <div className="text-sm text-teal-100">Monthly Events</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-sm text-teal-100">Would Recommend</div>
              </div>
            </div>
          </div>

          {/* Testimonial Preview */}
          <div className="bg-white rounded-lg shadow-md p-8 mt-12">
            <div className="text-center">
              <div className="text-6xl text-teal-600 mb-4">"</div>
              <blockquote className="text-xl text-gray-700 mb-6 italic">
                The Trainn coach community has been instrumental in my success. From getting advice on pricing to finding collaboration partners, this network has truly transformed my coaching business.
              </blockquote>
              <div className="text-gray-600">
                <div className="font-semibold">Sarah Martinez</div>
                <div className="text-sm">Yoga & Mindfulness Coach</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-teal-50 rounded-lg p-8 mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Our Growing Community</h3>
            <p className="text-gray-600 mb-6">
              Be part of a community that celebrates your success and supports your growth
            </p>
            <Link 
              href="/auth?register=true&role=coach" 
              className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-700 transition"
            >
              Become a Coach
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}