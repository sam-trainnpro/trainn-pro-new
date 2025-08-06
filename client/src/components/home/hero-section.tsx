import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";
import { useState } from "react";
import ReferralModal from "../referral-modal";

export default function HeroSection() {
  const { user } = useSafeAuth();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  
  return (
    <>
      {/* Hero Image Container - Full viewport width */}
      <div className="relative"
           style={{
             marginLeft: 'calc(-50vw + 50%)',
             marginRight: 'calc(-50vw + 50%)',
             width: '100vw',
             backgroundColor: 'white'
           }}>
        {/* Image with overlay wrapper */}
        <div className="relative inline-block w-full">
          <img 
            src="/hero-v6-no-border.png"
            alt="Fitness and creative classes for adults and kids"
            className="w-full h-auto block"
            style={{
              maxHeight: '600px',
              objectFit: 'contain',
              margin: '0 auto'
            }}
          />
          
          {/* Overlay that matches image exactly */}
          <div className="absolute inset-0 pointer-events-none"
               style={{
                 background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
               }}>
            {/* Text content */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-4 text-center">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-4 text-white">
                  Find Your Perfect Class
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-white max-w-3xl mx-auto">
                  Connect with top providers in the San Francisco Bay Area for sports, workouts, music, art and other fun classes for adults and kids
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Buttons below hero image - Full width */}
      <div className="bg-white py-3 sm:py-6 w-full"
           style={{
             marginLeft: 'calc(-50vw + 50%)',
             marginRight: 'calc(-50vw + 50%)',
             width: '100vw'
           }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start max-w-lg sm:max-w-2xl mx-auto sm:mx-0">
            {/* Refer buttons - Mobile: above Find Classes, Desktop: to the right */}
            {user && (
              <>
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
                <div className="sm:order-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-primary border-primary hover:bg-primary hover:text-white w-full sm:w-auto"
                    onClick={() => {/* TODO: Add refer provider functionality */}}
                  >
                    Refer a Provider
                  </Button>
                </div>
              </>
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
                <Link href="/auth?register=true&role=coach">
                  <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-full sm:w-auto">
                    Become a Provider
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

    </>
  );
}
