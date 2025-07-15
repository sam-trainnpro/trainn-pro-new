import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../../../hooks/use-auth-simple";
import { 
  Bell, 
  User, 
  ChevronDown, 
  Menu, 
  LogOut, 
  Settings, 
  Calendar, 
  Home, 
  Search,
  UserCircle,
  Heart,
  BookOpen
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  
  // Temporary fallback to prevent crashes
  let user = null;
  let logoutMutation = { mutate: () => {} };
  
  try {
    const auth = useAuth();
    user = auth.user;
    logoutMutation = auth.logoutMutation;
  } catch (error) {
    console.log("AuthProvider not available, using fallback");
  }
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Redirect to home page after successful logout
        window.location.href = "/";
      }
    });
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex flex-col items-start">
          <span className="text-primary text-2xl font-heading font-bold">Trainn</span>
          <span className="text-xs text-gray-600 leading-tight font-bold">
            Outdoor sports, fitness, music and art classes for adults and kids in San Francisco
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/classes" className={`text-foreground hover:text-primary transition font-medium ${location === '/classes' ? 'text-primary' : ''}`}>
            Classes
          </Link>
          <Link href="/coaches" className={`text-foreground hover:text-primary transition font-medium ${location === '/coaches' ? 'text-primary' : ''}`}>
            Coaches
          </Link>
          
          {/* Not logged in state */}
          {!user ? (
            <div className="flex items-center space-x-3">
              <Link href="/auth">
                <Button variant="ghost" className="text-foreground hover:text-primary font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth?register=true">
                <Button className="bg-primary text-white font-medium">
                  Join Now
                </Button>
              </Link>
            </div>
          ) : (
            /* Logged in state */
            <div className="flex items-center space-x-4">
              {user.role === 'coach' && (
                <Link href="/create-class">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Create Class
                  </Button>
                </Link>
              )}
              
              <Link href={user.role === 'coach' ? "/my-calendar" : "/bookings"}>
                <Button variant="ghost" className="p-2">
                  <Calendar className="h-5 w-5" />
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-1">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={`${user.firstName} ${user.lastName}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium">{user.firstName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={user.role === 'coach' ? "/my-classes" : "/bookings"} className="cursor-pointer w-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{user.role === 'coach' ? "My Classes" : "My Bookings"}</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'coach' && (
                    <DropdownMenuItem asChild>
                      <Link href="/my-calendar" className="cursor-pointer w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>My Calendar</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user.role === 'coach' || user.role === 'admin') && (
                    <DropdownMenuItem asChild>
                      <Link href="/customers" className="cursor-pointer w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Customers</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden p-2 pl-[9px] pr-[9px] pt-[10px] pb-[10px]">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col space-y-4 mt-6">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="mr-2 h-5 w-5" />
                  Home
                </Button>
              </Link>
              <Link href="/classes" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <Search className="mr-2 h-5 w-5" />
                  Classes
                </Button>
              </Link>
              <Link href="/coaches" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-5 w-5" />
                  Coaches
                </Button>
              </Link>
              
              {user ? (
                <>
                  <Link href={user.role === 'coach' ? "/my-classes" : "/bookings"} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Calendar className="mr-2 h-5 w-5" />
                      {user.role === 'coach' ? "My Classes" : "My Bookings"}
                    </Button>
                  </Link>
                  {user.role === 'coach' && (
                    <>
                      <Link href="/my-calendar" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Calendar className="mr-2 h-5 w-5" />
                          My Calendar
                        </Button>
                      </Link>
                      <Link href="/customers" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-5 w-5" />
                          Customers
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <UserCircle className="mr-2 h-5 w-5" />
                      My Profile
                    </Button>
                  </Link>
                  {user.role === 'coach' && (
                    <Link href="/create-class" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-primary text-white">
                        Create Class
                      </Button>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Settings className="mr-2 h-5 w-5" />
                          Admin Panel
                        </Button>
                      </Link>
                      <Link href="/admin?tab=classes" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <BookOpen className="mr-2 h-5 w-5" />
                          Class Management
                        </Button>
                      </Link>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive border-destructive"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary text-white">
                      Join Now
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
