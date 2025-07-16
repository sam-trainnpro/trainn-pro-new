import { Link } from "wouter";
import { AppleIcon, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DownloadApp() {
  return (
    <section className="py-8 md:py-12 bg-primary bg-opacity-5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">Take Trainn On The Go</h2>
            <p className="text-gray-600 mb-6">Make our web app quickly accessible on your iPhone. Within your browser click the rectangle button with an up arrow, scroll down and select "Add to Home Screen". Label the page Trainn.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="bg-[#333333] text-white border-[#333333] hover:bg-[#222222] flex items-center gap-2">
                <AppleIcon className="h-6 w-6" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="font-medium">App Store</div>
                </div>
              </Button>
              
              <Button variant="outline" className="bg-[#333333] text-white border-[#333333] hover:bg-[#222222] flex items-center gap-2">
                <Store className="h-6 w-6" />
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="font-medium">Google Play</div>
                </div>
              </Button>
            </div>
          </div>
          
          
        </div>
      </div>
    </section>
  );
}
