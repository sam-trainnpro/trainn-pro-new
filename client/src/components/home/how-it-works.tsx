import { Search, CalendarCheck, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">How Elevate Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-primary h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2">Find Your Class</h3>
            <p className="text-gray-600">Search and filter through hundreds of classes by type, location, time, and price to find the perfect fit for your fitness goals.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="text-primary h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2">Book & Pay</h3>
            <p className="text-gray-600">Securely book and pay for your classes in just a few clicks. Receive instant confirmation and add to your calendar.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartPulse className="text-primary h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-xl mb-2">Get Fit & Review</h3>
            <p className="text-gray-600">Attend your class, achieve your fitness goals, and leave a review to help other members find great coaches.</p>
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
    </section>
  );
}
