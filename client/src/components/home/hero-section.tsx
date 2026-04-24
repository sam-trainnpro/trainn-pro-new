import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";
import { useState } from "react";
import ReferralModal from "../referral-modal";
import ProviderReferralModal from "../provider-referral-modal";
import ReferProviderModal from "../refer-provider-modal";
import ReferProviderProviderModal from "../refer-provider-provider-modal";

export default function HeroSection() {
  const { user } = useSafeAuth();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isProviderReferralModalOpen, setIsProviderReferralModalOpen] = useState(false);
  const [isReferProviderModalOpen, setIsReferProviderModalOpen] = useState(false);
  const [isReferProviderProviderModalOpen, setIsReferProviderProviderModalOpen] = useState(false);
  
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
        {/* Image with overlay wrapper - centered with max width */}
        <div className="flex justify-center w-full">
          <div className="relative inline-block" style={{ maxWidth: '100%' }}>
            <img 
              src="/hero-v6-no-border.png"
              alt="Fitness and creative classes for adults and kids"
              className="block"
              style={{
                maxHeight: '600px',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%'
              }}
            />
            
            {/* Overlay that matches image dimensions exactly */}
            <div className="absolute inset-0 pointer-events-none"
                 style={{
                   background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))'
                 }}>
              {/* Text content */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 text-center">
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-4 text-white">
                    Activities for the Whole Family
                  </h1>
                </div>
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
                    onClick={() => {
                      if (user?.role === 'coach' || user?.role === 'admin') {
                        setIsProviderReferralModalOpen(true);
                      } else {
                        setIsReferralModalOpen(true);
                      }
                    }}
                  >
                    Refer a Friend
                  </Button>
                </div>
                <div className="sm:order-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-primary border-primary hover:bg-primary hover:text-white w-full sm:w-auto"
                    onClick={() => {
                      if (user?.role === 'customer') {
                        setIsReferProviderModalOpen(true);
                      } else if (user?.role === 'coach' || user?.role === 'admin') {
                        setIsReferProviderProviderModalOpen(true);
                      }
                    }}
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
            
            <div className="sm:order-1">
              <Link href="/plans">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-full sm:w-auto">
                  Explore Plans
                </Button>
              </Link>
            </div>
            
          </div>
        </div>
      </div>

      {/* Referral Modal - Only for customers */}
      {user?.role === 'customer' && (
        <ReferralModal
          isOpen={isReferralModalOpen}
          onClose={() => setIsReferralModalOpen(false)}
        />
      )}

      {/* Provider Referral Modal - Only for providers */}
      {(user?.role === 'coach' || user?.role === 'admin') && (
        <ProviderReferralModal
          isOpen={isProviderReferralModalOpen}
          onClose={() => setIsProviderReferralModalOpen(false)}
        />
      )}

      {/* Refer Provider Modal - Only for customers */}
      {user?.role === 'customer' && (
        <ReferProviderModal
          isOpen={isReferProviderModalOpen}
          onClose={() => setIsReferProviderModalOpen(false)}
        />
      )}

      {/* Refer Provider Provider Modal - Only for providers */}
      {(user?.role === 'coach' || user?.role === 'admin') && (
        <ReferProviderProviderModal
          isOpen={isReferProviderProviderModalOpen}
          onClose={() => setIsReferProviderProviderModalOpen(false)}
        />
      )}

    </>
  );
}
