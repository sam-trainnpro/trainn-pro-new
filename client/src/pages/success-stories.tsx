import { Link } from "wouter";
import { ArrowLeft, Star, TrendingUp, Award, DollarSign } from "lucide-react";

export default function SuccessStories() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
            <span className="text-sm font-medium uppercase tracking-wide">Coming Soon</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Inspiring stories from coaches who have built thriving businesses on Trainn
          </p>
        </div>
      </div>

      {/* Content Preview */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Real Stories, Real Results</h2>
            <p className="text-lg text-gray-600">
              Discover how coaches across the Bay Area are transforming their passion into profitable businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Top-Rated Coaches</h3>
              </div>
              <p className="text-gray-600">
                Learn from coaches who consistently earn 5-star reviews and build loyal client communities
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Growth Journeys</h3>
              </div>
              <p className="text-gray-600">
                From part-time coaching to full-time businesses - see how coaches scale their impact
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Income Success</h3>
              </div>
              <p className="text-gray-600">
                Real earnings data and strategies from coaches earning $3,000+ per month on the platform
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Award className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Recognition Stories</h3>
              </div>
              <p className="text-gray-600">
                Coaches who have gained recognition in their communities and built lasting impact
              </p>
            </div>
          </div>

          {/* Stats Preview */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mt-12 text-white">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Success by the Numbers</h3>
              <p className="text-blue-100">What our top coaches are achieving</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">95%</div>
                <div className="text-sm text-blue-100">Coach Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">$4.2K</div>
                <div className="text-sm text-blue-100">Avg Monthly Earnings</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">4.8★</div>
                <div className="text-sm text-blue-100">Average Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">85%</div>
                <div className="text-sm text-blue-100">Client Retention</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-green-50 rounded-lg p-8 mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Success Story</h3>
            <p className="text-gray-600 mb-6">
              Join hundreds of coaches who are building successful businesses on Trainn
            </p>
            <Link 
              href="/auth?register=true&role=coach" 
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Apply to Coach
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}