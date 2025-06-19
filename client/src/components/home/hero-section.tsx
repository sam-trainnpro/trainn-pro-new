import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../../../hooks/use-auth-simple";

export default function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="relative">
      <div 
        className="h-[420px] md:h-[500px] w-full bg-cover bg-center"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-xl text-white">
              <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">Find Your Perfect Workout</h1>
              <p className="text-lg mb-6">Connect with top fitness coaches in your area for personalized outdoor and gym sessions</p>
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
