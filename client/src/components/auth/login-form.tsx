import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../../../hooks/use-auth-simple";
import ForgotPasswordForm from "./forgot-password-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [, navigate] = useLocation();
  const { loginMutation, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Use effect for navigation instead of conditional rendering
  // Commented out since AuthPage already handles this redirect
  // This prevents double redirection which could cause runtime errors
  /*
  React.useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting from login form");
      setTimeout(() => {
        navigate("/");
      }, 0);
    }
  }, [user, navigate]);
  */
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  async function onSubmit(data: LoginFormValues) {
    try {
      setError(null);
      console.log("Submitting login form:", { email: data.email, password: "***" });
      
      // We need to prevent the runtime error that might be happening 
      // due to state updates during form submission
      try {
        const user = await loginMutation.mutateAsync(data);
        console.log("Login successful:", user);
        
        // Let AuthPage handle the redirect via its useEffect - this prevents race conditions
        console.log("Login form completed, letting AuthPage handle redirect");
      } catch (mutationError: any) {
        console.error("Mutation error:", mutationError);
        setError(mutationError.message || "Login failed. Please check your credentials and try again.");
      }
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "Login failed. Please check your credentials and try again.");
    }
  }
  
  if (showForgotPassword) {
    return (
      <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Welcome back to Trainn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="" {...field} />
                  </FormControl>
                  <div className="flex justify-end mt-1">
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-secondary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-destructive text-sm mt-2">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
        
        <div className="mt-6">
          <Separator className="my-4" />
          <div className="text-center text-sm text-muted-foreground mb-4">
            Or continue with
          </div>
          
          <Button 
            type="button"
            variant="outline"
            className="w-full border border-gray-300 hover:bg-gray-50"
            onClick={() => {
              // Get current role preference from URL or default to customer
              const searchParams = new URLSearchParams(window.location.search);
              const role = searchParams.get('role') || 'customer';
              window.location.href = `/api/auth/google?role=${role}`;
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
