import { Link } from "wouter";
import { ArrowLeft, BookOpen, Video, FileText, Users } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function CoachResources() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
            <span className="text-sm font-medium uppercase tracking-wide">Coming Soon</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Coach Resources</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Comprehensive guides, training materials, and resources to help you succeed as a Trainn coach
          </p>
        </div>
      </div>

      {/* Content Preview */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What's Coming</h2>
            <p className="text-lg text-gray-600">
              We're building a comprehensive resource center to support your coaching journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Training Guides</h3>
              </div>
              <p className="text-gray-600">
                Step-by-step guides on class planning, safety protocols, and best practices for outdoor coaching
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Video className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Video Tutorials</h3>
              </div>
              <p className="text-gray-600">
                Expert-led video content covering platform features, marketing strategies, and client management
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Templates & Forms</h3>
              </div>
              <p className="text-gray-600">
                Ready-to-use templates for waivers, class descriptions, pricing sheets, and promotional materials
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Support Network</h3>
              </div>
              <p className="text-gray-600">
                Access to mentorship programs, coach certification paths, and direct support channels
              </p>
            </div>
          </div>

          {/* Notification Signup */}
          <div className="bg-blue-50 rounded-lg p-8 mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Notified When We Launch</h3>
            <p className="text-gray-600 mb-6">
              Be the first to access our comprehensive coach resource center
            </p>
            <Link 
              href="/auth?register=true&role=coach" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Join as Coach
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}