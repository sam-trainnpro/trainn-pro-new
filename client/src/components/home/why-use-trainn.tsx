import { Users, DollarSign, TrendingUp, Calendar, Clock, Award } from "lucide-react";

export default function WhyUseTrainn() {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-4">Why Use Trainn</h2>
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
          Flexible fitness, sports, and creative classes for adults and kids in the San Francisco Bay Area, LA and beyond!
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Customers Section */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6">Customers</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed">Build skills, strength, confidence and community through local activities</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed">Save an average of 8 hours a month by accessing activities for kids and adults on one platform</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed">Save about $200 per year with flexible drop-in style classes that meet your schedule and don't require long-term commitments</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Providers Section */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-6">Providers</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    Increase income and monthly earning potential
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    Easy to use and free platform to handle class scheduling, packages, payment collection and customer engagement
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    Increase existing class sizes by 20%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
