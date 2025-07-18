import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";

export default function HeroSection() {
  const { user } = useSafeAuth();
  
  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* Hero Image Container */}
      <div className="relative w-full h-full overflow-hidden">
        <img 
          src="https://res.cloudinary.com/dbtslhlgp/image/upload/v1752879604/trainn/hero-home-page-v4-upscaled.jpg"
          alt="Fitness and creative classes for adults and kids"
          className="w-full h-full object-cover min-h-[400px] sm:min-h-[300px] max-h-[500px] sm:max-h-[600px] block"
          style={{ 
            display: 'block', 
            width: '100vw',
            objectPosition: 'center center'
          }}
        />
        
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60"></div>
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-start">
          <div className="container mx-auto px-4 pt-4 sm:pt-8 md:pt-16">
            <div className="max-w-lg sm:max-w-xl text-white">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold mb-3 sm:mb-4">Find Your Perfect Class</h1>
              <p className="text-sm sm:text-lg mb-4 sm:mb-6 leading-tight sm:leading-normal">Connect with top coaches and teachers in the San Francisco Bay Area for outdoor sports, workouts, music and art classes for adults and kids</p>
              
              {/* Mobile buttons - shown on image for mobile */}
              <div className="flex md:hidden flex-col gap-2 mt-4">
                <Link href="/classes">
                  <Button size="sm" className="bg-primary text-white hover:bg-primary/90 w-full text-sm">
                    Find Classes Now
                  </Button>
                </Link>
                {!user && (
                  <Link href="/register?role=coach">
                    <Button size="sm" variant="outline" className="bg-white text-primary hover:bg-white/90 w-full text-sm">
                      Become a Coach
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* Desktop buttons - shown on image */}
              <div className="hidden md:flex flex-col sm:flex-row gap-3 mt-8">
                <Link href="/classes">
                  <Button size="lg" className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto">
                    Find Classes Now
                  </Button>
                </Link>
                {!user && (
                  <Link href="/register?role=coach">
                    <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                      Become a Coach
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
