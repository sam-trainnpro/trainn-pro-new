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
      {/* Hero Image Container - Full viewport width with no margins */}
      <div className="relative w-full h-auto overflow-hidden bg-white"
           style={{
             marginLeft: 'calc(-50vw + 50%)',
             marginRight: 'calc(-50vw + 50%)',
             width: '100vw'
           }}>
        <img 
          src="/hero-v6-updated.png"
          alt="Fitness and creative classes for adults and kids"
          className="w-full h-auto object-contain"
          style={{
            maxHeight: '600px',
            margin: '0 auto',
            display: 'block'
          }}
        />
      </div>
      
      {/* Buttons below hero image - Full width */}
      <div className="bg-white py-3 sm:py-6 w-full"
           style={{
             marginLeft: 'calc(-50vw + 50%)',
             marginRight: 'calc(-50vw + 50%)',
             width: '100vw'
           }}>
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

    </>
  );
}
