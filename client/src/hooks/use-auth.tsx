import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LoginData = {
  email: string;
  password: string;
};

// Make sure RegisterData includes all fields from the registration form, including termsAccepted
type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  termsAccepted?: boolean; // Add termsAccepted as optional since it's only for validation
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Use a try/catch wrapper for all API calls to prevent uncaught exceptions
  const safeApiCall = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return safeApiCall(async () => {
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      });
    },
    onSuccess: (user: User) => {
      try {
        queryClient.setQueryData(["/api/user"], user);
        toast({
          title: "Logged in successfully",
          description: `Welcome back, ${user.firstName}!`,
        });
      } catch (error) {
        console.error("Error in loginMutation onSuccess:", error);
      }
    },
    onError: (error: Error) => {
      try {
        console.error("Login mutation error:", error);
        toast({
          title: "Login failed",
          description: error.message || "An error occurred during login",
          variant: "destructive",
        });
      } catch (err) {
        console.error("Error in loginMutation onError:", err);
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      return safeApiCall(async () => {
        // Remove termsAccepted from the data sent to the server
        const { termsAccepted, ...dataToSend } = userData;
        const res = await apiRequest("POST", "/api/register", dataToSend);
        return await res.json();
      });
    },
    onSuccess: (user: User) => {
      try {
        queryClient.setQueryData(["/api/user"], user);
        toast({
          title: "Registration successful",
          description: `Welcome to Elevate, ${user.firstName}!`,
        });
      } catch (error) {
        console.error("Error in registerMutation onSuccess:", error);
      }
    },
    onError: (error: Error) => {
      try {
        console.error("Registration mutation error:", error);
        toast({
          title: "Registration failed",
          description: error.message || "An error occurred during registration",
          variant: "destructive",
        });
      } catch (err) {
        console.error("Error in registerMutation onError:", err);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return safeApiCall(async () => {
        await apiRequest("POST", "/api/logout");
      });
    },
    onSuccess: () => {
      try {
        queryClient.setQueryData(["/api/user"], null);
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account.",
        });
      } catch (error) {
        console.error("Error in logoutMutation onSuccess:", error);
      }
    },
    onError: (error: Error) => {
      try {
        console.error("Logout mutation error:", error);
        toast({
          title: "Logout failed",
          description: error.message || "An error occurred during logout",
          variant: "destructive",
        });
      } catch (err) {
        console.error("Error in logoutMutation onError:", err);
      }
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
