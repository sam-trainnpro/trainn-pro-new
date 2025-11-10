import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "../../hooks/use-auth-simple";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import RegisterPage from "@/pages/register";
import AboutPage from "@/pages/about";
import FAQPage from "@/pages/faq";
import ProviderFAQPage from "@/pages/provider-faq";
import ContactPage from "@/pages/contact";
import ClassesPage from "@/pages/classes";
import CoachesPage from "@/pages/coaches";
import ClassDetailsPage from "@/pages/class-details";
import CoachDetailsPage from "@/pages/coach-details";
import BookingsPage from "@/pages/bookings";
import CheckoutPage from "@/pages/checkout";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
import CreateClassPage from "@/pages/create-class";
import MyClassesPage from "@/pages/my-classes";
import EditClassPage from "@/pages/edit-class";
import ResetPasswordPage from "@/pages/reset-password";
import ForgotPasswordPage from "@/pages/forgot-password";
import ReviewPage from "@/pages/review";
import CustomersPage from "@/pages/customers";
import AllCustomersPage from "@/pages/all-customers";
import MyCalendarPage from "@/pages/my-calendar";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import BlogAdminPage from "@/pages/blog-admin";
import BlogCreatePage from "@/pages/blog-create";
import BlogEditPage from "@/pages/blog-edit";
import DMCAPage from "@/pages/dmca";
import CommunityGuidelinesPage from "@/pages/community-guidelines";
import GiftTermsPage from "@/pages/gift-terms";
import CustomerReferralsPage from "@/pages/customer-referrals";
import TermsOfUsePage from "@/pages/terms-of-use";
import PrivacyPage from "@/pages/privacy";
import CookiesPage from "@/pages/cookies";
import AdminPromoCodesPage from "@/pages/admin-promo-codes";
import CoachPromoCodesPage from "@/pages/coach-promo-codes";
import CreatePackagePage from "@/pages/create-package";
import MyPackagesPage from "@/pages/my-packages";
import EditPackagePage from "@/pages/edit-package";
import PackagesPage from "@/pages/packages";
import PackagePurchasePage from "@/pages/package-purchase";
import PackageCheckoutPage from "@/pages/package-checkout";
import TimeBoundPackageCheckoutPage from "@/pages/time-bound-package-checkout";
import TimeBoundPackageDetailsPage from "@/pages/time-bound-package-details";
import CoachResourcesPage from "@/pages/coach-resources";
import SuccessStoriesPage from "@/pages/success-stories";
import BusinessToolsPage from "@/pages/business-tools";
import CoachCommunityPage from "@/pages/coach-community";
import OutdoorWorkoutsSF from "@/pages/outdoor-workouts-sf";
import KidsDropInSportsSF from "@/pages/kids-drop-in-sports-sf";
import KidsAfterSchoolActivitiesSF from "@/pages/kids-after-school-activities-sf";
import LandingPagesPage from "@/pages/landing-pages";
import ProviderLandingPage from "@/pages/provider-landing";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/register">
        <RegisterPage />
      </Route>
      <Route path="/forgot-password">
        <ForgotPasswordPage />
      </Route>
      <Route path="/reset-password">
        <ResetPasswordPage />
      </Route>
      <Route path="/about">
        <AboutPage />
      </Route>
      <Route path="/faq">
        <FAQPage />
      </Route>
      <Route path="/provider-faq">
        <ProviderFAQPage />
      </Route>
      <Route path="/contact">
        <ContactPage />
      </Route>
      <Route path="/landing-pages">
        <LandingPagesPage />
      </Route>
      <Route path="/provider-landing">
        <ProviderLandingPage />
      </Route>
      <Route path="/classes">
        <ClassesPage />
      </Route>
      <Route path="/packages">
        <PackagesPage />
      </Route>
      <Route path="/package/:id">
        <TimeBoundPackageDetailsPage />
      </Route>
      <ProtectedRoute path="/package/:packageId/purchase">
        <PackagePurchasePage />
      </ProtectedRoute>
      <ProtectedRoute path="/package-checkout">
        <PackageCheckoutPage />
      </ProtectedRoute>
      <ProtectedRoute path="/time-bound-package-checkout">
        <TimeBoundPackageCheckoutPage />
      </ProtectedRoute>
      <Route path="/classes/:id">
        <ClassDetailsPage />
      </Route>
      <Route path="/class/:id">
        <ClassDetailsPage />
      </Route>
      <Route path="/outdoor-workouts-san-francisco">
        <OutdoorWorkoutsSF />
      </Route>
      <Route path="/kids-drop-in-sports-classes-san-francisco">
        <KidsDropInSportsSF />
      </Route>
      <Route path="/kids-after-school-activities-san-francisco">
        <KidsAfterSchoolActivitiesSF />
      </Route>
      <Route path="/coaches">
        <CoachesPage />
      </Route>
      <Route path="/coaches/:id">
        <CoachDetailsPage />
      </Route>
      <ProtectedRoute path="/bookings">
        <BookingsPage />
      </ProtectedRoute>
      <ProtectedRoute path="/checkout/:classId">
        <CheckoutPage />
      </ProtectedRoute>
      <ProtectedRoute path="/profile">
        <ProfilePage />
      </ProtectedRoute>
      <ProtectedRoute path="/admin">
        <AdminPage />
      </ProtectedRoute>
      <ProtectedRoute path="/create-class">
        <CreateClassPage />
      </ProtectedRoute>
      <ProtectedRoute path="/create-package">
        <CreatePackagePage />
      </ProtectedRoute>
      <ProtectedRoute path="/my-packages">
        <MyPackagesPage />
      </ProtectedRoute>
      <ProtectedRoute path="/my-classes">
        <MyClassesPage />
      </ProtectedRoute>
      <ProtectedRoute path="/edit-class/:id">
        <EditClassPage />
      </ProtectedRoute>
      <ProtectedRoute path="/edit-package/:id">
        <EditPackagePage />
      </ProtectedRoute>
      <ProtectedRoute path="/review">
        <ReviewPage />
      </ProtectedRoute>
      <ProtectedRoute path="/customers">
        <CustomersPage />
      </ProtectedRoute>
      <ProtectedRoute path="/all-customers">
        <AllCustomersPage />
      </ProtectedRoute>
      <ProtectedRoute path="/my-calendar">
        <MyCalendarPage />
      </ProtectedRoute>
      <ProtectedRoute path="/admin/promo-codes">
        <AdminPromoCodesPage />
      </ProtectedRoute>
      <ProtectedRoute path="/promo-codes">
        <CoachPromoCodesPage />
      </ProtectedRoute>
      <ProtectedRoute path="/blog/admin/edit/:id">
        <BlogEditPage />
      </ProtectedRoute>
      <ProtectedRoute path="/blog/admin/create">
        <BlogCreatePage />
      </ProtectedRoute>
      <ProtectedRoute path="/blog/admin">
        <BlogAdminPage />
      </ProtectedRoute>
      <Route path="/blog/:slug">
        <BlogPostPage />
      </Route>
      <Route path="/blog">
        <BlogPage />
      </Route>
      <Route path="/terms/dmca">
        <DMCAPage />
      </Route>
      <Route path="/about/communityguidelines">
        <CommunityGuidelinesPage />
      </Route>
      <Route path="/terms/gifts">
        <GiftTermsPage />
      </Route>
      <Route path="/terms/customer-referrals">
        <CustomerReferralsPage />
      </Route>
      <Route path="/terms">
        <TermsOfUsePage />
      </Route>
      <Route path="/privacy">
        <PrivacyPage />
      </Route>
      <Route path="/cookies">
        <CookiesPage />
      </Route>
      <Route path="/coach-resources">
        <CoachResourcesPage />
      </Route>
      <Route path="/success-stories">
        <SuccessStoriesPage />
      </Route>
      <Route path="/business-tools">
        <BusinessToolsPage />
      </Route>
      <Route path="/coach-community">
        <CoachCommunityPage />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
