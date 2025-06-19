import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "../../../hooks/use-auth";
import { useToast } from "../../../hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Helmet } from "react-helmet";

// Form schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // State for profile image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle image file selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  // Upload image and get URL
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.imageUrl;
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user) throw new Error("User not found");
      
      let profileImageUrl = data.profileImage;
      
      // Upload new image if one was selected
      if (selectedImage) {
        setUploadingImage(true);
        try {
          profileImageUrl = await uploadImage(selectedImage);
        } finally {
          setUploadingImage(false);
        }
      }
      
      const profileData = {
        ...data,
        profileImage: profileImageUrl,
      };
      
      const response = await apiRequest("PUT", `/api/users/${user.id}`, profileData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], updatedUser);
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
  
  // Stripe Connect onboarding mutation
  const stripeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not found");
      
      const response = await apiRequest("POST", `/api/coaches/${user.id}/stripe-onboarding`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create Stripe onboarding link");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // For mobile devices, use location.href instead of window.open for better compatibility
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, navigate directly to the Stripe URL
        window.location.href = data.onboardingUrl;
      } else {
        // On desktop, open in new window
        window.open(data.onboardingUrl, '_blank', 'noopener,noreferrer');
        
        toast({
          title: "Opening Stripe setup",
          description: "Complete your payment setup in the new window, then return here to continue.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Setup failed",
        description: error.message || "Could not start payment setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check Stripe Connect status
  const { data: stripeStatus, isLoading: isLoadingStripeStatus, refetch: refetchStripeStatus } = useQuery({
    queryKey: [`/api/coaches/${user?.id}/stripe-status`],
    enabled: !!user && user.role === 'coach',
    refetchOnWindowFocus: true,
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
  
  // Handle Stripe Connect setup
  const handleStripeConnectSetup = () => {
    if (!user) return;
    stripeOnboardingMutation.mutate();
  };

  // Check for success/refresh URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Payment setup completed!",
        description: "Your Stripe account has been successfully connected. You can now receive payments.",
      });
      refetchStripeStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('refresh') === 'true') {
      toast({
        title: "Setup incomplete",
        description: "Please complete your payment setup to receive payments from bookings.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchStripeStatus]);

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
        <title>My Profile | Trainn</title>
        <meta name="description" content="View and manage your Trainn profile settings" />
      </Helmet>

      <Header />
      
      <main className="flex-1 pb-16 pt-6">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid gap-6">
            <div className="space-y-6">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  {user.role === 'coach' && (
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information and profile details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. +1234567890" />
                                </FormControl>
                                <FormDescription>
                                  Include country code (e.g. +1 for US, +44 for UK)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-4">
                            <label htmlFor="profileImage" className="text-sm font-medium">Profile Picture</label>
                            
                            {/* Current Image Preview */}
                            {user.profileImage && !selectedImage && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 mb-2">Current profile picture:</p>
                                <img 
                                  src={user.profileImage} 
                                  alt="Current profile picture" 
                                  className="w-24 h-24 object-cover rounded-full border"
                                />
                              </div>
                            )}
                            
                            {/* New Image Preview */}
                            {selectedImage && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 mb-2">New profile picture preview:</p>
                                <img 
                                  src={URL.createObjectURL(selectedImage)} 
                                  alt="New profile picture preview" 
                                  className="w-24 h-24 object-cover rounded-full border"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  className="mt-2"
                                  onClick={() => setSelectedImage(null)}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                            
                            <Input
                              id="profileImage"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="cursor-pointer"
                            />
                            <p className="text-sm text-gray-600">
                              Upload a profile picture. Square images work best. Accepted formats: JPG, PNG, GIF
                            </p>
                          </div>

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
                              disabled={isUpdating || uploadingImage}
                            >
                              {(isUpdating || uploadingImage) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {uploadingImage ? "Uploading image..." : "Saving..."}
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
                          Set up your bank account to receive payments for your classes. Trainn takes a 15% platform fee, and you receive 85% of each booking.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingStripeStatus ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Checking payment status...</span>
                          </div>
                        ) : stripeStatus?.onboarded ? (
                          <div className="space-y-6">
                            <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-green-800">Payment Account Connected</h3>
                                <p className="text-sm text-green-700">
                                  Your Stripe account is set up and ready to receive payments. You'll receive 85% of each booking directly to your bank account.
                                </p>
                              </div>
                            </div>
                            
                            {stripeStatus.canReceivePayments && (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Payment Details</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                  <li>✓ Account verified and active</li>
                                  <li>✓ Payouts enabled</li>
                                  <li>✓ Ready to receive payments from bookings</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <h3 className="text-sm font-medium text-amber-800 mb-2">Payment Setup Required</h3>
                              <p className="text-sm text-amber-700">
                                To receive payments from your classes, you need to connect your bank account through Stripe. This is secure and takes just a few minutes.
                              </p>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="font-medium">How it works:</h4>
                              <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start space-x-2">
                                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                  <span>Click "Set Up Payments" to start the secure Stripe onboarding process</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                  <span>Provide your business details and bank account information</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                  <span>Start receiving 85% of each booking directly to your account</span>
                                </li>
                              </ul>
                            </div>
                            
                            <Button 
                              onClick={handleStripeConnectSetup}
                              className="w-full bg-primary text-white"
                              disabled={stripeOnboardingMutation.isPending}
                            >
                              {stripeOnboardingMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Setting up...
                                </>
                              ) : (
                                "Set Up Payments with Stripe"
                              )}
                            </Button>
                          </div>
                        )}
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