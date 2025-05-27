import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [, navigate] = useLocation();
  const { loginMutation, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
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
        
        // Use window.location.href instead of navigate for more reliable navigation
        // after authentication state changes
        window.setTimeout(() => {
          console.log("Navigating to home after login");
          window.location.href = "/";
        }, 100);
      } catch (mutationError: any) {
        console.error("Mutation error:", mutationError);
        setError(mutationError.message || "Login failed. Please check your credentials and try again.");
      }
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "Login failed. Please check your credentials and try again.");
    }
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
                    <Input type="email" placeholder="you@example.com" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <div className="flex justify-end mt-1">
                    <Link href="#" className="text-sm text-secondary hover:underline">
                      Forgot password?
                    </Link>
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
            
            <div className="text-center mt-4">
              <span className="text-sm">Don't have an account?</span>{" "}
              <Link href="/auth?register=true" className="text-sm text-secondary hover:underline">
                Create account
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
