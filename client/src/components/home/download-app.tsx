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
            <p className="text-gray-600 mb-6">Download our mobile app to easily find, book, and manage your fitness classes anywhere. Get exclusive app-only deals and notifications for your favorite coaches.</p>
            
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
          
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000" 
              alt="Trainn Mobile App Interface" 
              className="max-w-full h-auto rounded-xl shadow-xl"
              style={{ maxHeight: '500px' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
