import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "../../hooks/use-auth-simple";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import RegisterPage from "@/pages/register";
import AboutPage from "@/pages/about";
import FAQPage from "@/pages/faq";
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
import EditClassPage from "@/pages/edit-class-new";
import ResetPasswordPage from "@/pages/reset-password";
import ForgotPasswordPage from "@/pages/forgot-password";
import ReviewPage from "@/pages/review";
import CustomersPage from "@/pages/customers";
import MyCalendarPage from "@/pages/my-calendar";
import BlogPage from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import BlogAdminPage from "@/pages/blog-admin";
import DMCAPage from "@/pages/dmca";
import CommunityGuidelinesPage from "@/pages/community-guidelines";
import GiftTermsPage from "@/pages/gift-terms";
import CustomerReferralsPage from "@/pages/customer-referrals";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
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
      <Route path="/contact">
        <ContactPage />
      </Route>
      <Route path="/classes">
        <ClassesPage />
      </Route>
      <Route path="/classes/:id">
        <ClassDetailsPage />
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
      <ProtectedRoute path="/my-classes">
        <MyClassesPage />
      </ProtectedRoute>
      <ProtectedRoute path="/edit-class/:id">
        <EditClassPage />
      </ProtectedRoute>
      <ProtectedRoute path="/review">
        <ReviewPage />
      </ProtectedRoute>
      <ProtectedRoute path="/customers">
        <CustomersPage />
      </ProtectedRoute>
      <ProtectedRoute path="/my-calendar">
        <MyCalendarPage />
      </ProtectedRoute>
      <Route path="/blog">
        <BlogPage />
      </Route>
      <Route path="/blog/:slug">
        <BlogPostPage />
      </Route>
      <ProtectedRoute path="/blog/admin">
        <BlogAdminPage />
      </ProtectedRoute>
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
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
