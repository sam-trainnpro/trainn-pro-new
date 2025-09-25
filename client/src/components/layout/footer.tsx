import { Link } from "wouter";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";
import { useState } from "react";
import ReferralModal from "../referral-modal";
import ProviderReferralModal from "../provider-referral-modal";
import ReferProviderModal from "../refer-provider-modal";
import ReferProviderProviderModal from "../refer-provider-provider-modal";

function ReferralLink() {
  const { user } = useSafeAuth();
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isProviderReferralModalOpen, setIsProviderReferralModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button 
        onClick={() => {
          if (user.role === 'coach' || user.role === 'admin') {
            setIsProviderReferralModalOpen(true);
          } else {
            setIsReferralModalOpen(true);
          }
        }}
        className="text-gray-400 hover:text-white transition text-left"
      >
        Refer a Friend
      </button>
      
      {/* Customer Referral Modal */}
      {user.role === 'customer' && (
        <ReferralModal
          isOpen={isReferralModalOpen}
          onClose={() => setIsReferralModalOpen(false)}
        />
      )}
      
      {/* Provider Referral Modal */}
      {(user.role === 'coach' || user.role === 'admin') && (
        <ProviderReferralModal
          isOpen={isProviderReferralModalOpen}
          onClose={() => setIsProviderReferralModalOpen(false)}
        />
      )}
    </>
  );
}

function ReferProviderLinkCustomers() {
  const { user } = useSafeAuth();
  const [isReferProviderModalOpen, setIsReferProviderModalOpen] = useState(false);

  if (!user || user.role !== 'customer') return null;

  return (
    <>
      <button 
        onClick={() => setIsReferProviderModalOpen(true)}
        className="text-gray-400 hover:text-white transition text-left"
      >
        Refer a Provider
      </button>
      <ReferProviderModal
        isOpen={isReferProviderModalOpen}
        onClose={() => setIsReferProviderModalOpen(false)}
      />
    </>
  );
}

function ReferProviderLinkProviders() {
  const { user } = useSafeAuth();
  const [isReferProviderProviderModalOpen, setIsReferProviderProviderModalOpen] = useState(false);

  if (!user || (user.role !== 'coach' && user.role !== 'admin')) return null;

  return (
    <>
      <button 
        onClick={() => setIsReferProviderProviderModalOpen(true)}
        className="text-gray-400 hover:text-white transition text-left"
      >
        Refer a Provider
      </button>
      <ReferProviderProviderModal
        isOpen={isReferProviderProviderModalOpen}
        onClose={() => setIsReferProviderProviderModalOpen(false)}
      />
    </>
  );
}

export default function Footer() {
  const { user } = useSafeAuth();
  
  return (
    <footer className="bg-[#333333] text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Trainn</h3>
            <p className="text-gray-400 mb-4">Connecting people of all ages with top providers for personalized sports, fitness, music and art classes.</p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/trainn_global/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61578989286567" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/trainn-pro" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Customers</h4>
            <ul className="space-y-2">
              <li><Link href="/auth?register=true" className="text-gray-400 hover:text-white transition">Join Now</Link></li>
              <li><Link href="/classes" className="text-gray-400 hover:text-white transition">Find Classes</Link></li>
              <li><Link href="/packages" className="text-gray-400 hover:text-white transition">Find Packages</Link></li>
              <li><Link href="/coaches" className="text-gray-400 hover:text-white transition">Find Providers</Link></li>
              <li><ReferralLink /></li>
              <li><ReferProviderLinkCustomers /></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Providers</h4>
            <ul className="space-y-2">
              {(!user || (user.role !== 'coach' && user.role !== 'admin')) && (
                <li><Link href="/auth?register=true&role=coach" className="text-gray-400 hover:text-white transition">Join as a Provider</Link></li>
              )}
              <li><Link href="/coach-resources" className="text-gray-400 hover:text-white transition">Provider Resources</Link></li>
              <li><Link href="/success-stories" className="text-gray-400 hover:text-white transition">Success Stories</Link></li>
              <li><Link href="/business-tools" className="text-gray-400 hover:text-white transition">Business Tools</Link></li>
              <li><Link href="/coach-community" className="text-gray-400 hover:text-white transition">Provider Community</Link></li>
              {(user?.role === 'coach' || user?.role === 'admin') && (
                <li><Link href="/provider-faq" className="text-gray-400 hover:text-white transition">Provider FAQ</Link></li>
              )}
              <li><ReferProviderLinkProviders /></li>
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
              <li><Link href="/landing-pages" className="text-gray-400 hover:text-white transition">Landing Pages</Link></li>
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
