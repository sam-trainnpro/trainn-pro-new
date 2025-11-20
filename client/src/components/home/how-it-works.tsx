import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">How Trainn Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-2xl font-bold">1</span>
            </div>
            <h3 className="font-heading font-bold text-xl mb-2">Find Your Class</h3>
            <p className="text-gray-600">Search and filter through hundreds of classes by type, location, time, and age group to find the right adult or kids class.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-[#ffffff]">2</span>
            </div>
            <h3 className="font-heading font-bold text-xl mb-2">Book & Pay</h3>
            <p className="text-gray-600">Securely book and pay in just a few clicks. Receive instant confirmation and add to your calendar.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-2xl font-bold">3</span>
            </div>
            <h3 className="font-heading font-bold text-xl mb-2">Trainn & Review</h3>
            <p className="text-gray-600">Attend your class, achieve your goals, have fun, and leave a review to help others find great providers.</p>
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <Link href="/classes">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
