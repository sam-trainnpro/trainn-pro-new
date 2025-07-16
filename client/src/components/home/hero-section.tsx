import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";

export default function HeroSection() {
  const { user } = useSafeAuth();
  
  return (
    <section className="relative">
      <div 
        className="h-[420px] md:h-[500px] w-full bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/attached_assets/Family Workout 3_1752642007550.png')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-xl text-white">
              <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">Find Your Perfect Class</h1>
              <p className="text-lg mb-6">Connect with top coaches and teachers in the San Francisco Bay Area for outdoor sports, workouts, music, art and dance classes for adults and kids</p>
              <div className="flex flex-col sm:flex-row gap-3">
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
    </section>
  );
}
