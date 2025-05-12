import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";

export default function AuthPage() {
  // Fix: wouter's useLocation returns [path, navigate] where path is just a string
  const [path, navigate] = useLocation();
  const { user } = useAuth();
  
  // Get URL and extract search params
  const currentURL = new URL(window.location.href);
  const hasRegisterParam = currentURL.searchParams.has('register');
  const defaultTab = hasRegisterParam ? "register" : "login";
  const defaultRole = currentURL.searchParams.get('role') || "customer";

  // Add debugging
  console.log("Auth page path:", path);
  console.log("Auth page params:", { defaultTab, defaultRole });
  
  // Redirect if the user is already logged in
  // Use a safe approach to navigation
  React.useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to home");
      setTimeout(() => {
        navigate("/");
      }, 0);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Helmet>
        <title>Sign In or Join - Elevate Fitness</title>
        <meta name="description" content="Sign in to your Elevate account or join our fitness community to find and book fitness classes with top coaches in your area." />
      </Helmet>
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Create Account</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm defaultRole={defaultRole} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 bg-primary hidden md:block">
        <div className="h-full flex items-center justify-center p-8 relative">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
            }}
          ></div>
          <div className="relative z-10 text-white max-w-lg text-center">
            <h1 className="text-4xl font-bold mb-4">Transform Your Fitness Journey</h1>
            <p className="text-xl mb-6">
              Connect with top coaches, book personalized classes, and achieve your fitness goals with Elevate.
            </p>
            <div className="grid grid-cols-2 gap-4 my-8">
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-1">1000+</h3>
                <p>Fitness Classes</p>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-1">500+</h3>
                <p>Certified Coaches</p>
              </div>
            </div>
            <p className="text-lg font-light">
              "Elevate has transformed how I find fitness classes and coaches. The platform is intuitive and the classes are amazing!"
            </p>
            <p className="mt-2 font-medium">— Jennifer K., Elevate Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}
