import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../../../hooks/use-auth-simple";
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
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Core country codes for the dropdown
const countryCodes = [
  { code: "+1", country: "US/Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
];

// Create a more robust schema with appropriate validation
const registerSchemaBase = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must not exceed 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must not exceed 50 characters"),
  email: z.string().email("Please enter a valid email address").max(100, "Email must not exceed 100 characters"),
  countryCode: z.string().min(1, "Please select a country code"),
  phone: z.string().min(10, "Please enter a 10-digit phone number").max(10, "Phone number must be exactly 10 digits").regex(/^\d{10}$/, "Phone number must contain only digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),
  role: z.enum(["customer", "coach"], {
    required_error: "Please select a role",
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
});

type RegisterFormValues = z.infer<typeof registerSchemaBase>;

interface RegisterFormProps {
  defaultRole?: string;
  onSuccess?: () => void;
}

export default function RegisterForm({ defaultRole = "customer", onSuccess }: RegisterFormProps) {
  const [, navigate] = useLocation();
  const { registerMutation, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Use effect for navigation instead of conditional rendering
  // Commented out since AuthPage already handles this redirect
  // This prevents double redirection which could cause runtime errors
  /*
  React.useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting from registration form");
      setTimeout(() => {
        navigate("/");
      }, 0);
    }
  }, [user, navigate]);
  */
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchemaBase),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+1",
      phone: "",
      password: "",
      role: defaultRole as "customer" | "coach",
      termsAccepted: false,
    },
  });
  
  // Add a safe submission handler
  async function onSubmit(data: RegisterFormValues) {
    try {
      setError(null);
      console.log("Submitting registration form:", { ...data, password: "***" });
      
      // Combine country code and phone number
      const fullPhoneNumber = `${data.countryCode}${data.phone}`;
      const submitData = {
        ...data,
        phone: fullPhoneNumber,
      };
      
      // Remove countryCode from the submit data since backend expects only phone
      const { countryCode, ...backendData } = submitData;
      
      // We need to prevent the runtime error that might be happening 
      // due to state updates during form submission
      try {
        const user = await registerMutation.mutateAsync(backendData);
        console.log("Registration successful:", user);
        
        // Use window.location.href for more reliable navigation
        // after authentication state changes
        window.setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            console.log("Navigating to home after registration");
            window.location.href = "/";
          }
        }, 100);
      } catch (mutationError: any) {
        console.error("Mutation error:", mutationError);
        setError(mutationError.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "Registration failed. Please try again.");
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Join Trainn to find or host fitness classes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className={`border ${field.value === 'customer' ? 'border-primary text-primary' : 'border-gray-300 text-gray-700'} hover:bg-gray-50 py-2 rounded-lg transition text-center cursor-pointer`}>
                          <RadioGroupItem
                            value="customer"
                            id="customer"
                            className="sr-only"
                          />
                          <label htmlFor="customer" className="cursor-pointer font-medium w-full h-full block">
                            Customer
                          </label>
                        </div>
                        <div className={`border ${field.value === 'coach' ? 'border-primary text-primary' : 'border-gray-300 text-gray-700'} hover:bg-gray-50 py-2 rounded-lg transition text-center cursor-pointer`}>
                          <RadioGroupItem
                            value="coach"
                            id="coach"
                            className="sr-only"
                          />
                          <label htmlFor="coach" className="cursor-pointer font-medium w-full h-full block">
                            Coach
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
            
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="1234567890" 
                          maxLength={10}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input 
                      type="checkbox" 
                      className="mt-1"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      I agree to the <a href="#" className="text-secondary hover:underline">Terms of Service</a> and{" "}
                      <a href="#" className="text-secondary hover:underline">Privacy Policy</a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-destructive text-sm mt-2">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
