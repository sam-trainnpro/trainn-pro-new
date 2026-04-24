import { Link, useLocation } from "wouter";
import { Home, Search, Calendar, User } from "lucide-react";
import { useAuth } from "../../../../hooks/use-auth-simple";

export default function MobileNavigation() {
  const [location] = useLocation();
  
  const { user } = useAuth();

  // Determine if current location matches the booking/calendar route
  const isBookingCalendarActive = user?.role === 'coach' 
    ? (location === '/my-calendar') 
    : (location === '/bookings');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 border-t border-gray-200">
      <div className="flex justify-around">
        <Link href="/">
          <div className={`flex flex-col items-center py-2 px-4 ${location === '/' ? 'text-primary' : 'text-gray-500'}`}>
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        <Link href="/classes">
          <div className={`flex flex-col items-center py-2 px-4 ${location === '/classes' ? 'text-primary' : 'text-gray-500'}`}>
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1">Explore</span>
          </div>
        </Link>
        <Link href={user?.role === 'coach' ? '/my-calendar' : '/bookings'}>
          <div className={`flex flex-col items-center py-2 px-4 ${isBookingCalendarActive ? 'text-primary' : 'text-gray-500'}`}>
            <Calendar className="w-5 h-5" />
            <span className="text-xs mt-1">{user?.role === 'coach' ? 'Calendar' : 'Bookings'}</span>
          </div>
        </Link>
        <Link href="/profile">
          <div className={`flex flex-col items-center py-2 px-4 ${location === '/profile' ? 'text-primary' : 'text-gray-500'}`}>
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
