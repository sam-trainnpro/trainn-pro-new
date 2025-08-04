import { Link } from "wouter";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";
import { useState } from "react";
import ReferralModal from "../referral-modal";

function ReferralLink() {
  const { user } = useSafeAuth();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button 
        onClick={() => setIsReferralModalOpen(true)}
        className="text-gray-400 hover:text-white transition text-left"
      >
        Refer a Friend
      </button>
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
      />
    </>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#333333] text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Trainn</h3>
            <p className="text-gray-400 mb-4">Connecting people of all ages with top coaches for personalized outdoor sports, fitness, music and art classes.</p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Customers</h4>
            <ul className="space-y-2">
              <li><Link href="/auth?register=true" className="text-gray-400 hover:text-white transition">Join Now</Link></li>
              <li><Link href="/classes" className="text-gray-400 hover:text-white transition">Find Classes</Link></li>
              <li><Link href="/coaches" className="text-gray-400 hover:text-white transition">Find Coaches</Link></li>
              <li><ReferralLink /></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Coaches</h4>
            <ul className="space-y-2">
              <li><Link href="/auth?register=true&role=coach" className="text-gray-400 hover:text-white transition">Join as Coach</Link></li>
              <li><Link href="/coach-resources" className="text-gray-400 hover:text-white transition">Coach Resources</Link></li>
              <li><Link href="/success-stories" className="text-gray-400 hover:text-white transition">Success Stories</Link></li>
              <li><Link href="/business-tools" className="text-gray-400 hover:text-white transition">Business Tools</Link></li>
              <li><Link href="/coach-community" className="text-gray-400 hover:text-white transition">Coach Community</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition">FAQ</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Careers</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-white transition">Blog</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Press</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2025 Trainn Global, LLC. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition text-sm">Terms of Use</Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition text-sm">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
