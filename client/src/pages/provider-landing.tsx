
import { Link } from "wouter";
import { Check, Clock, Users, TrendingUp, Calendar, Tag, Phone, Sparkles } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function ProviderLanding() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Grow Your Business with Trainn
            </h1>
            <p className="text-xl md:text-2xl text-teal-100 mb-8">
              Connect with hundreds of eager students. Trainn is free to join, easy to manage, and built to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth?register=true&role=coach" 
                className="inline-block bg-white text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Get Started Free
              </Link>
              <Link 
                href="/contact" 
                className="inline-block bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-800 transition border-2 border-white/30"
              >
                Schedule a Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Coaches Choose Trainn
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage and grow your services business in one powerful platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free to Join */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">100% Free to Start</h3>
            <p className="text-gray-600 mb-4">
              No setup fees, no monthly charges, no hidden costs. List unlimited classes and only pay a small commission when you earn.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Unlimited class listings</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>No upfront investment</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Pay only when you earn</span>
              </li>
            </ul>
          </div>

          {/* Quick Setup */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">30-Minute Setup</h3>
            <p className="text-gray-600 mb-4">
              Get your profile live in just 30 minutes. Our intuitive platform makes it easy to add classes and make updates anytime.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Simple step-by-step process</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Edit anytime you need</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>No technical skills required</span>
              </li>
            </ul>
          </div>

          {/* Expand Reach */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Expand Your Reach</h3>
            <p className="text-gray-600 mb-4">
              Tap into Trainn's growing customer base of fitness enthusiasts actively searching for classes in the Bay Area.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Access thousands of students</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Targeted local marketing</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Fill empty class spots</span>
              </li>
            </ul>
          </div>

          {/* Schedule Management */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Easy Schedule Management</h3>
            <p className="text-gray-600 mb-4">
              Powerful yet simple tools to manage your class schedule, track attendance, and stay organized.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Visual calendar interface</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Real-time booking updates</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Automated reminders</span>
              </li>
            </ul>
          </div>

          {/* Promo Codes & Packages */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Tag className="h-8 w-8 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Flexible Pricing Tools</h3>
            <p className="text-gray-600 mb-4">
              Create custom promo codes and class packages to attract new students and reward loyal customers.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-pink-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Custom discount codes</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-pink-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Multi-class packages</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-pink-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Early bird specials</span>
              </li>
            </ul>
          </div>

          {/* Local Support */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Phone className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">SF Bay Area Support</h3>
            <p className="text-gray-600 mb-4">
              Get personalized help from our local team. We're here in the Bay Area to support your success.
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>In-person meetups available</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Phone support when you need it</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Local community events</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Join a Thriving Community
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">150+</div>
                <div className="text-teal-100">Active Coaches</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
                <div className="text-teal-100">Students</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
                <div className="text-teal-100">Classes Weekly</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">4.9★</div>
                <div className="text-teal-100">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Getting Started is Simple
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your Profile</h3>
                <p className="text-gray-600">
                  Sign up for free and tell us about your coaching expertise, certifications, and what makes you unique. Add photos and a compelling bio.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">List Your Classes</h3>
                <p className="text-gray-600">
                  Add your class schedule with details like location, time, difficulty level, and pricing. Create packages and special offers to attract students.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start Accepting Bookings</h3>
                <p className="text-gray-600">
                  Students can discover and book your classes instantly. Get notifications, manage your calendar, and watch your business grow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            What Coaches Are Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-yellow-500 mb-4">★★★★★</div>
              <p className="text-gray-700 mb-4 italic">
                "Trainn helped me fill my morning yoga classes that were always running empty. Within a month, I had consistent attendance and new regular students!"
              </p>
              <div className="font-semibold text-gray-900">Maria Chen</div>
              <div className="text-sm text-gray-600">Yoga Instructor, Oakland</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-yellow-500 mb-4">★★★★★</div>
              <p className="text-gray-700 mb-4 italic">
                "The platform is incredibly easy to use. I was up and running in 20 minutes, and the local support team has been amazing whenever I've had questions."
              </p>
              <div className="font-semibold text-gray-900">James Rodriguez</div>
              <div className="text-sm text-gray-600">CrossFit Coach, San Francisco</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-yellow-500 mb-4">★★★★★</div>
              <p className="text-gray-700 mb-4 italic">
                "I love the package feature! It's helped me build a loyal client base and increase my monthly recurring revenue significantly."
              </p>
              <div className="font-semibold text-gray-900">Sarah Johnson</div>
              <div className="text-sm text-gray-600">Pilates Instructor, Berkeley</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Grow Your Coaching Business?
            </h2>
            <p className="text-xl text-teal-100 mb-8">
              Join hundreds of coaches who are already reaching more students and earning more with Trainn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth?register=true&role=coach" 
                className="inline-block bg-white text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Get Started Free Today
              </Link>
              <Link 
                href="/provider-faq" 
                className="inline-block bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-800 transition border-2 border-white/30"
              >
                Learn More
              </Link>
            </div>
            <p className="text-teal-100 mt-6 text-sm">
              No credit card required • Set up in 30 minutes • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
