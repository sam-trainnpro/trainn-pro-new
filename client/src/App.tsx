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
import MyClassesPage from "@/pages/my-classes";
import EditClassPage from "@/pages/edit-class";
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
      <Route>
        <NotFound />
      </Route>
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
