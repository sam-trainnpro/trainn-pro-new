import { Link } from "wouter";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#333333] text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Trainn</h3>
            <p className="text-gray-400 mb-4">Connecting fitness enthusiasts of all ages with top coaches for personalized outdoor workouts, sports, and gym training sessions.</p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Customers</h4>
            <ul className="space-y-2">
              <li><Link href="/classes" className="text-gray-400 hover:text-white transition">Find Classes</Link></li>
              <li><Link href="/coaches" className="text-gray-400 hover:text-white transition">Find Coaches</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Coaches</h4>
            <ul className="space-y-2">
              <li><Link href="/auth?register=true&role=coach" className="text-gray-400 hover:text-white transition">Join as Coach</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Coach Resources</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Success Stories</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Business Tools</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Coach Community</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Careers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Press</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2023 Trainn. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition text-sm">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
