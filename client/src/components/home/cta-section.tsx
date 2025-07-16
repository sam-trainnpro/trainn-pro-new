import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-12 md:py-16 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-4">Ready to Trainn?</h2>
        <p className="text-white text-opacity-90 mb-8 max-w-2xl mx-auto">Join hundreds of members who are upskilling their life, building community and getting Trainned by top coaches through personalized classes.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/classes">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
              Find Classes Now
            </Button>
          </Link>
          <Link href="/auth?register=true&role=coach">
            <Button size="lg" variant="outline" className="bg-transparent border border-white text-white hover:bg-white/10 w-full sm:w-auto">
              Become a Coach
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
