import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, LogOut, Settings, CalendarClock, ClipboardList, UserCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

// Profile form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
  bio: z.string().optional(),
  profileImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Payment settings form schema for coaches
const paymentSettingsSchema = z.object({
  accountType: z.enum(["individual", "company"], {
    required_error: "Please select account type",
  }),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(8, "Valid account number is required")
    .max(17, "Account number cannot exceed 17 characters"),
  routingNumber: z.string().min(9, "Routing number must be 9 digits")
    .max(9, "Routing number must be 9 digits")
    .regex(/^\d+$/, "Routing number must contain only digits"),
  bankName: z.string().min(2, "Bank name is required"),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms to continue",
  }),
});

type PaymentSettingsValues = z.infer<typeof paymentSettingsSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingPaymentSettings, setIsUpdatingPaymentSettings] = useState(false);

  // Form for profile data
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    },
  });

  // Form for password change
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Payment settings form (for coaches)
  const paymentSettingsForm = useForm<PaymentSettingsValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      accountType: "individual",
      accountHolderName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      acceptTerms: false,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsUpdating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update your profile. Please try again.",
        variant: "destructive",
      });
      setIsUpdating(false);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}/password`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message || "Could not update your password. Please try again.",
        variant: "destructive",
      });
      setIsChangingPassword(false);
    },
  });
  
  // Update payment settings mutation
  const updatePaymentSettingsMutation = useMutation({
    mutationFn: async (data: {
      accountType: string;
      accountHolderName: string;
      accountNumber: string;
      routingNumber: string;
      bankName: string;
    }) => {
      // This will be connected to Stripe Connect in a secure way
      const response = await apiRequest("POST", `/api/coaches/${user?.id}/payment-settings`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment settings updated",
        description: "Your bank account information has been securely saved.",
      });
      
      // Mark user's bank account as verified
      queryClient.setQueryData(["/api/user"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          bankAccountVerified: true
        };
      });
      
      setIsUpdatingPaymentSettings(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Payment setup failed",
        description: error.message || "Could not update your payment information. Please try again.",
        variant: "destructive",
      });
      setIsUpdatingPaymentSettings(false);
    },
  });

  // Get user's bookings (for count display)
  const { data: bookings } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });

  // Get user's classes (for coaches)
  const { data: userClasses } = useQuery({
    queryKey: [`/api/coaches/${user?.id}/classes`],
    enabled: !!user && user.role === 'coach',
  });

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    setIsUpdating(true);
    updateProfileMutation.mutate(data);
  };

  // Handle password form submission
  const onPasswordSubmit = (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };
  
  // Handle payment settings form submission
  const onPaymentSettingsSubmit = (data: PaymentSettingsValues) => {
    if (!user) return;
    
    setIsUpdatingPaymentSettings(true);
    
    // Only proceed if the user has accepted the terms
    if (!data.acceptTerms) {
      toast({
        title: "Terms Required",
        description: "You must accept the terms to continue.",
        variant: "destructive",
      });
      setIsUpdatingPaymentSettings(false);
      return;
    }
    
    // Submit payment information to update the coach's bank details
    updatePaymentSettingsMutation.mutate({
      accountType: data.accountType,
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      routingNumber: data.routingNumber,
      bankName: data.bankName
    });
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile | Elevate</title>
        <meta name="description" content="View and manage your Elevate profile settings" />
      </Helmet>

      <Header />
      
      <main className="flex-1 pb-16 pt-6">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-24 w-24">
                      {user.profileImage ? (
                        <AvatarImage src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                      ) : (
                        <AvatarFallback className="text-xl">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-1 text-center">
                      <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize">
                        {user.role}
                        {user.role === 'coach' && !user.isApproved && (
                          <span className="ml-1 text-yellow-500">(Pending Approval)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Account Overview</h3>
                    <div className="grid gap-1">
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center text-sm">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Role</span>
                        </div>
                        <span className="text-sm capitalize">{user.role}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center text-sm">
                          <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Member Since</span>
                        </div>
                        <span className="text-sm">May 2025</span>
                      </div>
                      {user.role === 'customer' && (
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center text-sm">
                            <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Bookings</span>
                          </div>
                          <span className="text-sm">{bookings?.length || 0}</span>
                        </div>
                      )}
                      {user.role === 'coach' && (
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center text-sm">
                            <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Classes</span>
                          </div>
                          <span className="text-sm">{userClasses?.length || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              <Tabs defaultValue="profile">
                <TabsList className="mb-6">
                  <TabsTrigger value="profile">Profile Information</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  {user.role === 'coach' && (
                    <TabsTrigger value="payment">Payment Settings</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile</CardTitle>
                      <CardDescription>
                        This information will be displayed publicly so be careful what you share.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                              control={profileForm.control}
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
                              control={profileForm.control}
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
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="john.doe@example.com" 
                                    {...field} 
                                    disabled 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your email cannot be changed.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="profileImage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Profile Image URL</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://example.com/your-image.jpg" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  URL to your profile picture. Use a square image for best results.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {user.role === 'coach' && (
                            <FormField
                              control={profileForm.control}
                              name="bio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bio</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      {...field} 
                                      placeholder="Tell clients about yourself, your expertise, and your training style..." 
                                      className="min-h-32"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Your bio will be displayed on your public profile
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit" 
                              className="bg-primary text-white"
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>
                        Change your password here. After saving, you'll be logged out.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Password must be at least 8 characters long
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit" 
                              className="bg-primary text-white"
                              disabled={isChangingPassword}
                            >
                              {isChangingPassword ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Change Password"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Payment Settings Tab - Only visible for coaches */}
                {user.role === 'coach' && (
                  <TabsContent value="payment">
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Settings</CardTitle>
                        <CardDescription>
                          Set up your bank account to receive payments for your classes. Elevate takes a 15% platform fee, and you receive 85% of each booking.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...paymentSettingsForm}>
                          <form onSubmit={paymentSettingsForm.handleSubmit(onPaymentSettingsSubmit)} className="space-y-6">
                            <FormField
                              control={paymentSettingsForm.control}
                              name="accountType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Type</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select account type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="individual">Individual</SelectItem>
                                      <SelectItem value="company">Company</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Select whether this is a personal or business account
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentSettingsForm.control}
                              name="accountHolderName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Account Holder Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="John Doe" />
                                  </FormControl>
                                  <FormDescription>
                                    The name on your bank account
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={paymentSettingsForm.control}
                                name="accountNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Account Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="password" placeholder="XXXXXXXX" />
                                    </FormControl>
                                    <FormDescription>
                                      Your bank account number
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={paymentSettingsForm.control}
                                name="routingNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Routing Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="XXXXXXXXX" />
                                    </FormControl>
                                    <FormDescription>
                                      Your bank's 9-digit routing number
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={paymentSettingsForm.control}
                              name="bankName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bank Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Bank of America" />
                                  </FormControl>
                                  <FormDescription>
                                    The name of your banking institution
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={paymentSettingsForm.control}
                              name="acceptTerms"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>
                                      Accept Terms and Conditions
                                    </FormLabel>
                                    <FormDescription>
                                      I agree to the <a href="#" className="text-primary underline">terms of service</a> and authorize Elevate to process payments on my behalf and transfer funds to my bank account.
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end">
                              <Button 
                                type="submit" 
                                className="bg-primary text-white"
                                disabled={isUpdatingPaymentSettings}
                              >
                                {isUpdatingPaymentSettings ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  "Save Payment Information"
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </>
  );
}