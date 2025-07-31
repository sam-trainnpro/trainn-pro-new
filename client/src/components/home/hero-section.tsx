import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";
import { useState } from "react";
import ReferralModal from "../referral-modal";

export default function HeroSection() {
  const { user } = useSafeAuth();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  
  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* Hero Image Container */}
      <div className="relative w-full h-full overflow-hidden">
        <img 
          src="https://res.cloudinary.com/dbtslhlgp/image/upload/v1752879604/trainn/hero-home-page-v4-upscaled.jpg"
          alt="Fitness and creative classes for adults and kids"
          className="w-full h-auto sm:h-full object-contain sm:object-cover min-h-[300px] sm:min-h-[300px] max-h-none sm:max-h-[600px] block"
          style={{ 
            display: 'block', 
            width: '100vw'
          }}
        />
        
        {/* Overlay for text readability - desktop only */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 hidden sm:block"></div>
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center sm:items-start justify-center sm:justify-start">
          <div className="container mx-auto px-4 pt-4 sm:pt-8 md:pt-16 text-center sm:text-left">
            <div className="max-w-lg sm:max-w-xl text-white">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold mb-3 sm:mb-4">Find Your Perfect Class</h1>
              <p className="text-sm sm:text-lg mb-4 sm:mb-6 leading-tight sm:leading-normal">Connect with top coaches and teachers in the San Francisco Bay Area for outdoor sports, workouts, music and art classes for adults and kids</p>

            </div>
          </div>
        </div>
      </div>
      
      {/* Buttons below hero image */}
      <div className="bg-white py-3 sm:py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start max-w-lg sm:max-w-xl mx-auto sm:mx-0">
            {/* Refer a Friend button - Mobile: above Find Classes, Desktop: to the right */}
            {user && (
              <div className="sm:order-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-coral-500 border-coral-500 hover:bg-coral-50 w-full sm:w-auto"
                  onClick={() => setIsReferralModalOpen(true)}
                >
                  Refer a Friend
                </Button>
              </div>
            )}
            
            <div className="sm:order-1">
              <Link href="/classes">
                <Button size="lg" className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto">
                  Find Classes Now
                </Button>
              </Link>
            </div>
            
            {!user && (
              <div className="sm:order-2">
                <Link href="/register?role=coach">
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-full sm:w-auto">
                    Become a Coach
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referral Modal */}
      {user && (
        <ReferralModal
          isOpen={isReferralModalOpen}
          onClose={() => setIsReferralModalOpen(false)}
        />
      )}

    </div>
  );
}
