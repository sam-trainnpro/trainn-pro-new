import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "../../../hooks/use-auth-simple";
import { useToast } from "../../../hooks/use-toast";
import { ClassCategory } from "@shared/schema";
import { Loader2, X, DollarSign, Users, Gift, Heart, Mail, CreditCard, Infinity, Calendar, AlertCircle, ArrowRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Helmet } from "react-helmet";

// Form schemas
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  businessName: z.string().optional(),
  displayBusinessName: z.boolean().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  areasOfExpertise: z.array(z.number()).optional(),
  certifications: z.string().optional(),
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

// Stripe Status Interface
interface StripeStatus {
  connected: boolean;
  onboarded: boolean;
  canReceivePayments: boolean;
  accountId?: string;
}

// User Subscription Interface
interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  classesUsedThisPeriod: number;
  classesAllottedThisPeriod: number;
  cancelAtPeriodEnd: boolean;
  plan: {
    id: number;
    name: string;
    classesPerMonth: number | null;
    isUnlimited: boolean;
    pricePerClass: number | null;
    monthlyPrice: number;
  };
  totalClassesTaken: number;
  classesRemaining: number | 'unlimited';
}

// Dashboard Component
function DashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch user credit balance 
  const { data: creditData } = useQuery({
    queryKey: ['/api/credits/balance'],
    enabled: !!user,
  });
  
  const creditBalance = (creditData as { balance?: number })?.balance || 0;

  // Fetch class attendance stats
  const { data: classStats } = useQuery<{ allTime: number; thisMonth: number; lastMonth: number }>({
    queryKey: ['/api/user/class-stats'],
    enabled: !!user,
  });
  
  // Fetch user subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<UserSubscription | null>({
    queryKey: ['/api/subscriptions/my'],
    enabled: !!user,
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscriptions/cancel");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel subscription");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/my'] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the end of your current billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscriptions/reactivate");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reactivate subscription");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/my'] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated and will continue as normal.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync subscription from Stripe (for missed webhooks)
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscriptions/sync");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to sync subscription");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/my'] });
      toast({
        title: "Subscription Synced",
        description: "Your subscription has been synced successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Result",
        description: error.message,
        variant: "default",
      });
    },
  });
  
  // Fetch referral data if available
  const { data: referralData } = useQuery({
    queryKey: ['/api/referrals/my-referrals'],
    enabled: !!user,
  });
  
  // Fetch favorite providers (coaches whose classes the user has liked)
  const { data: favoriteProviders = [] } = useQuery({
    queryKey: ['/api/user/favorite-providers'],
    enabled: !!user,
  });
  
  const referrals = (referralData as any[]) || [];
  const completedReferrals = referrals.filter((r: any) => r.status === 'completed').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="space-y-6">
      {subscription ? (
        <Card className={subscription.cancelAtPeriodEnd 
          ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800" 
          : "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
        }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {subscription.plan.name}
                </CardTitle>
                <CardDescription>
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Cancels on {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  ) : (
                    <span>
                      Renews on {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge 
                variant="outline" 
                className={subscription.cancelAtPeriodEnd 
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-green-100 text-green-800 border-green-300"
                }
              >
                {subscription.cancelAtPeriodEnd ? 'Cancelling' : 'Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-[#15a34a]">
                  {subscription.classesRemaining === 'unlimited' ? (
                    <Infinity className="w-6 h-6 mx-auto" />
                  ) : (
                    subscription.classesRemaining
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold">{subscription.classesUsedThisPeriod}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Used This Month</div>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold">${Math.floor(subscription.plan.monthlyPrice)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Monthly</div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/classes'}
                data-testid="button-browse-classes"
              >
                Browse Classes <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              {subscription.cancelAtPeriodEnd ? (
                <Button 
                  variant="default"
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                  data-testid="button-reactivate-subscription"
                >
                  {reactivateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Reactivate Subscription
                </Button>
              ) : (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel your subscription? You can continue using it until the end of your billing period.')) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  data-testid="button-cancel-subscription"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : !subscriptionLoading && user?.role === 'customer' ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Monthly Subscription
            </CardTitle>
            <CardDescription>
              Save on classes with a monthly subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to book classes under $40 with your monthly credits. 
              Plans start at $116/month for 4 classes.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => window.location.href = '/plans'}
                data-testid="button-view-plans"
              >
                View Plans <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                data-testid="button-sync-subscription"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Already subscribed? Sync
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Class Stats
          </CardTitle>
          <CardDescription>
            Your class attendance history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-[#333333]">{classStats?.allTime || 0}</div>
              <div className="text-xs text-muted-foreground">All Time</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{classStats?.thisMonth || 0}</div>
              <div className="text-xs text-muted-foreground">This Month</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{classStats?.lastMonth || 0}</div>
              <div className="text-xs text-muted-foreground">Last Month</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Account Balance
          </CardTitle>
          <CardDescription>
            Your current account credit balance and referral earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 mb-2">
            ${(creditBalance / 100).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            Available to use on your next class booking
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
          </CardTitle>
          <CardDescription>
            Earn $5 for every friend you refer who completes their first class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{referrals.length}</div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completedReferrals}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorites
          </CardTitle>
          <CardDescription>
            Providers whose classes you've liked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {favoriteProviders.length > 0 ? (
            <div className="space-y-3">
              {favoriteProviders.map((provider: any) => (
                <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {provider.profileImage ? (
                      <img 
                        src={provider.profileImage} 
                        alt={`${provider.firstName} ${provider.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {provider.firstName[0]}{provider.lastName[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {provider.displayBusinessName && provider.businessName 
                          ? provider.businessName 
                          : `${provider.firstName} ${provider.lastName}`}
                      </p>
                      {provider.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {provider.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/coaches/${provider.id}`}
                    data-testid={`button-view-provider-${provider.id}`}
                  >
                    View Profile
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No favorite providers yet. Like some classes to see them here!
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>
            Manage your email notifications and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <div className="font-medium">Weekly Newsletter</div>
              <div className="text-sm text-gray-600">
                Receive our weekly digest with upcoming classes, new providers, and community reviews
              </div>
            </div>
            <Checkbox
              checked={user.receiveNewsletter ?? true}
              onCheckedChange={async (checked) => {
                try {
                  await apiRequest("PUT", `/api/users/${user.id}/newsletter-preference`, {
                    receiveNewsletter: checked
                  });
                  await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                  toast({
                    title: "Preferences Updated",
                    description: checked 
                      ? "You'll now receive our weekly newsletter" 
                      : "You've unsubscribed from the weekly newsletter",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to update email preferences",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="newsletter-preference-toggle"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // State for profile image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State for areas of expertise
  const [selectedExpertise, setSelectedExpertise] = useState<number[]>(user?.areasOfExpertise || []);

  // Fetch categories for areas of expertise
  const { data: categories = [] } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      businessName: user?.businessName || "",
      displayBusinessName: user?.displayBusinessName || false,
      phone: user?.phone || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
      areasOfExpertise: user?.areasOfExpertise || [],
      certifications: user?.certifications || "",
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

  // Handle adding expertise area
  const addExpertiseArea = (categoryId: string) => {
    const id = parseInt(categoryId);
    if (!selectedExpertise.includes(id)) {
      const newExpertise = [...selectedExpertise, id];
      setSelectedExpertise(newExpertise);
      profileForm.setValue('areasOfExpertise', newExpertise);
    }
  };

  // Handle removing expertise area
  const removeExpertiseArea = (categoryId: number) => {
    const newExpertise = selectedExpertise.filter(id => id !== categoryId);
    setSelectedExpertise(newExpertise);
    profileForm.setValue('areasOfExpertise', newExpertise);
  };

  // Upload image and get URL
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
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
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        displayBusinessName: data.displayBusinessName,
        phone: data.phone,
        bio: data.bio,
        certifications: data.certifications,
        areasOfExpertise: selectedExpertise,
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
      setSelectedExpertise(updatedUser.areasOfExpertise || []);
      setIsUpdating(false);
      
      // Reload the page to ensure all data is properly refreshed
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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
      const response = await fetch(`/api/users/${user?.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
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
  const { data: stripeStatus, isLoading: isLoadingStripeStatus, refetch: refetchStripeStatus } = useQuery<StripeStatus>({
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
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className={`grid w-full ${user.role === 'coach' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                {user.role === 'coach' && (
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                )}
              </TabsList>
                
                <TabsContent value="dashboard">
                  <DashboardContent />
                </TabsContent>
                
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

                          {user?.role === 'coach' && (
                            <>
                              <FormField
                                control={profileForm.control}
                                name="businessName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Business Name (Optional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g. FitLife Training Studio" />
                                    </FormControl>
                                    <FormDescription>
                                      Add your business name if you operate under a business entity
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="displayBusinessName"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>
                                        Display your Business Name to customers?
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

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
                                  onError={(e) => {
                                    // Hide the image container if it fails to load
                                    const target = e.target as HTMLImageElement;
                                    const container = target.closest('.mt-2') as HTMLElement;
                                    if (container) {
                                      container.style.display = 'none';
                                    }
                                  }}
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
                              Upload a profile picture. Square images work best. Accepted formats: JPG, PNG, GIF (max 40MB)
                            </p>
                          </div>

                          {user.role === 'coach' && (
                            <>
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
                                    Your bio will be displayed on your public profile. Include URLs (e.g., https://linktr.ee/yourname) to share external links with clients.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="space-y-4">
                              <FormLabel>Areas of Expertise</FormLabel>
                              <FormDescription>
                                Select the categories you specialize in teaching. This helps clients find the right coach for their needs.
                              </FormDescription>
                              
                              <div className="space-y-3">
                                <Select onValueChange={addExpertiseArea}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Add an area of expertise" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories
                                      .filter(category => !selectedExpertise.includes(category.id))
                                      .map(category => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                
                                {selectedExpertise.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedExpertise.map(categoryId => {
                                      const category = categories.find(c => c.id === categoryId);
                                      return category ? (
                                        <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                                          {category.name}
                                          <X 
                                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                            onClick={() => removeExpertiseArea(categoryId)}
                                          />
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <FormField
                              control={profileForm.control}
                              name="certifications"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Certifications</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="List your fitness certifications (e.g., NASM CPT, ISSA, ACE Fitness, NSCA, NPTI)..."
                                      className="min-h-24"
                                    />
                                  </FormControl>
                                  <FormDescription>Enter your professional certifications to build trust with clients</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            </>
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
        </main>
      <Footer />
      <MobileNavigation />
    </>
  );
}