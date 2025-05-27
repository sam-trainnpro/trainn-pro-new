import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import RegisterForm from "@/components/auth/register-form";
import { Helmet } from "react-helmet";
import { Link } from "wouter";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Get role from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const role = searchParams.get('role') || "customer";
  
  // Redirect if the user is already logged in
  useEffect(() => {
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
        <title>Create Account - Trainn Fitness</title>
        <meta name="description" content="Join Trainn fitness community to find and book fitness classes with top coaches in your area." />
      </Helmet>
      
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <RegisterForm defaultRole={role} />
          
          <div className="text-center mt-6">
            <span className="text-sm text-gray-600">Already have an account?</span>{" "}
            <Link href="/auth" className="text-sm text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </div>
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
            <h1 className="text-4xl font-bold mb-4">Start Your Fitness Journey</h1>
            <p className="text-xl mb-6">
              Join thousands of fitness enthusiasts and coaches on Trainn. Whether you're looking to get fit or share your expertise, we've got you covered.
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
              "Joining Trainn was the best decision for my fitness journey. The community and coaches are incredible!"
            </p>
            <p className="mt-2 font-medium">— Sarah M., New Trainn Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}