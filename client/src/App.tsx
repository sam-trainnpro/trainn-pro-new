import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import ClassesPage from "@/pages/classes";
import CoachesPage from "@/pages/coaches";
import ClassDetailsPage from "@/pages/class-details";
import CoachDetailsPage from "@/pages/coach-details";
import BookingsPage from "@/pages/bookings";
import CheckoutPage from "@/pages/checkout";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
import CreateClassPage from "@/pages/create-class";
import { ProtectedRoute } from "./lib/protected-route";

// Wrapper components to ensure each component returns an Element (not nullable)
const SafeHome = () => <Home />;
const SafeAuthPage = () => <AuthPage />;
const SafeClassesPage = () => <ClassesPage />;
const SafeClassDetailsPage = () => <ClassDetailsPage />;
const SafeCoachesPage = () => <CoachesPage />;
const SafeCoachDetailsPage = () => <CoachDetailsPage />;
const SafeBookingsPage = () => <BookingsPage />;
const SafeCheckoutPage = () => <CheckoutPage />;
const SafeProfilePage = () => <ProfilePage />;
const SafeAdminPage = () => <AdminPage />;
const SafeCreateClassPage = () => <CreateClassPage />;
const SafeNotFound = () => <NotFound />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={SafeHome} />
      <Route path="/auth" component={SafeAuthPage} />
      <Route path="/classes" component={SafeClassesPage} />
      <Route path="/classes/:id" component={SafeClassDetailsPage} />
      <Route path="/coaches" component={SafeCoachesPage} />
      <Route path="/coaches/:id" component={SafeCoachDetailsPage} />
      <ProtectedRoute path="/bookings" component={SafeBookingsPage} />
      <ProtectedRoute path="/checkout/:classId" component={SafeCheckoutPage} />
      <ProtectedRoute path="/profile" component={SafeProfilePage} />
      <ProtectedRoute path="/admin" component={SafeAdminPage} />
      <ProtectedRoute path="/create-class" component={SafeCreateClassPage} />
      <Route component={SafeNotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
