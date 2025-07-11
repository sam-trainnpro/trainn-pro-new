import React, { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "../../../hooks/use-auth-simple";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";

export default function AuthPage() {
  // Fix: wouter's useLocation returns [path, navigate] where path is just a string
  const [path, navigate] = useLocation();
  const { user } = useAuth();
  
  // Initialize with defaults and update after mount to avoid type errors
  const [authParams, setAuthParams] = useState({
    defaultTab: "login",
    defaultRole: "customer",
    resetToken: ""
  });
  
  const [activeTab, setActiveTab] = useState("login");
  
  // Set URL params after component mount using useEffect
  useEffect(() => {
    try {
      // Safe URL param extraction
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');
      const hasRegister = searchParams.has('register') || tab === 'register';
      const isReset = tab === 'reset';
      const role = searchParams.get('role') || "customer";
      const resetToken = searchParams.get('token') || "";
      
      let tabValue = "login";
      if (hasRegister) tabValue = "register";
      if (isReset) tabValue = "reset";
      
      setAuthParams({
        defaultTab: tabValue,
        defaultRole: role,
        resetToken: resetToken
      });
      
      setActiveTab(tabValue);
      
      console.log("Auth page path:", path);
      console.log("Auth params set:", { tab: tabValue, role, hasToken: !!resetToken });
    } catch (err) {
      console.error("Error parsing URL params:", err);
    }
  }, [path]);
  
  // Redirect if the user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting");
      setTimeout(() => {
        // Check for redirect URL in query params
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          navigate(decodeURIComponent(redirectUrl));
        } else {
          navigate("/");
        }
      }, 0);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Helmet>
        <title>Sign In or Join - Trainn Fitness</title>
        <meta name="description" content="Sign in to your Trainn account or join our fitness community to find and book fitness classes with top coaches in your area." />
      </Helmet>
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link href="/classes">
              <span className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer">
                ← Back to Classes
              </span>
            </Link>
          </div>
          {activeTab === "reset" ? (
            <ResetPasswordForm token={authParams.resetToken} />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm defaultRole={authParams.defaultRole} />
              </TabsContent>
            </Tabs>
          )}
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
            <h1 className="text-4xl font-bold mb-4">Building stronger communities through fitness, creativity and play</h1>
            <p className="text-xl mb-6">
              Connect with top coaches, book personalized classes, and achieve your goals with Trainn.
            </p>
            <div className="grid grid-cols-2 gap-4 my-8">
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-1">1000+</h3>
                <p>Adult & Kids Classes</p>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-1">500+</h3>
                <p>Certified Coaches</p>
              </div>
            </div>
            <p className="text-lg font-light">
              "Trainn has transformed how I find classes for me and my kids. The platform is intuitive and the classes are amazing!"
            </p>
            <p className="mt-2 font-medium">— Lea G., Trainn Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}
