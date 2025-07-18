import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";

export default function HeroSection() {
  const { user } = useSafeAuth();
  
  return (
    <section className="relative w-full">
      {/* Hero Image Container */}
      <div className="relative w-full overflow-hidden">
        <img 
          src="https://res.cloudinary.com/dbtslhlgp/image/upload/v1752879604/trainn/hero-home-page-v4-upscaled.jpg"
          alt="Fitness and creative classes for adults and kids"
          className="w-full h-auto object-cover min-h-[300px] max-h-[600px]"
        />
        
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60"></div>
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-start">
          <div className="container mx-auto px-4 pt-8 md:pt-16">
            <div className="max-w-xl text-white">
              <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">Find Your Perfect Class</h1>
              <p className="text-lg mb-6">Connect with top coaches and teachers in the San Francisco Bay Area for outdoor sports, workouts, music and art classes for adults and kids</p>
              
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
      
      {/* Mobile buttons - shown below image on white background */}
      <div className="md:hidden bg-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3">
            <Link href="/classes">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 w-full">
                Find Classes Now
              </Button>
            </Link>
            {!user && (
              <Link href="/register?role=coach">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white w-full">
                  Become a Coach
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
