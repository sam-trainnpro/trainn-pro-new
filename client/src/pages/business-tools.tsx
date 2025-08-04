import { Link } from "wouter";
import { ArrowLeft, Calculator, BarChart3, Calendar, CreditCard, MessageSquare, Shield } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function BusinessTools() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
            <span className="text-sm font-medium uppercase tracking-wide">Coming Soon</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Business Tools</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Professional tools and analytics to help you grow and manage your coaching business
          </p>
        </div>
      </div>

      {/* Content Preview */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-gray-600">
              Professional business tools designed specifically for fitness and creative coaches
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h3>
              </div>
              <p className="text-gray-600">
                Track bookings, revenue, client retention, and performance metrics with detailed insights
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Calculator className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Pricing Calculator</h3>
              </div>
              <p className="text-gray-600">
                Optimize your pricing strategy with market analysis and profit margin calculators
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Schedule Management</h3>
              </div>
              <p className="text-gray-600">
                Advanced scheduling tools with automated reminders and waitlist management
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="h-8 w-8 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Payment Tools</h3>
              </div>
              <p className="text-gray-600">
                Flexible payment options, package deals, and automated billing for recurring clients
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <MessageSquare className="h-8 w-8 text-teal-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Client Communication</h3>
              </div>
              <p className="text-gray-600">
                Integrated messaging, progress tracking, and feedback collection systems
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Insurance & Legal</h3>
              </div>
              <p className="text-gray-600">
                Liability coverage options, waiver management, and legal protection resources
              </p>
            </div>
          </div>

          {/* Feature Highlight */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mt-12 text-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">All-in-One Business Solution</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                No more juggling multiple apps and platforms. Everything you need to run your coaching business, integrated into one powerful platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold mb-2">10+</div>
                  <div className="text-sm text-blue-100">Business Tools</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-sm text-blue-100">Support Access</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">$0</div>
                  <div className="text-sm text-blue-100">Setup Fees</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-purple-50 rounded-lg p-8 mt-12 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Upgrade Your Business?</h3>
            <p className="text-gray-600 mb-6">
              Get early access to our complete suite of business tools when you join as a coach
            </p>
            <Link 
              href="/auth?register=true&role=coach" 
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Start Your Business
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}