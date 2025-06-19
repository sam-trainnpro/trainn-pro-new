import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { User } from "../shared/schema";
import { apiRequest, queryClient, getQueryFn } from "../client/src/lib/queryClient";
import { useToast } from "./use-toast";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  termsAccepted?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Create context with undefined default
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Get current user data
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Submitting login form:", { ...credentials, password: "***" });
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${user.firstName}`,
      });
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { termsAccepted, ...dataToSend } = userData;
      const res = await apiRequest("POST", "/api/register", dataToSend);
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to Trainn, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear(); // Clear all cached data on logout
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout",
        variant: "destructive",
      });
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
  if (context === undefined) {
    console.log("AuthProvider not available, using fallback");
    // Return safe fallback for development
    return {
      user: null,
      isLoading: false,
      error: null,
      loginMutation: {
        mutate: () => console.log("AuthProvider not available - login"),
        mutateAsync: async () => {
          console.log("AuthProvider not available - loginAsync");
          throw new Error("Authentication not available");
        },
        isPending: false,
        isError: false,
        error: null,
        data: undefined,
        isIdle: true,
        isSuccess: false,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        status: "idle" as const,
        variables: undefined,
        submittedAt: 0,
        reset: () => {},
        context: undefined,
      },
      logoutMutation: {
        mutate: () => console.log("AuthProvider not available - logout"),
        mutateAsync: async () => {
          console.log("AuthProvider not available - logoutAsync");
          throw new Error("Authentication not available");
        },
        isPending: false,
        isError: false,
        error: null,
        data: undefined,
        isIdle: true,
        isSuccess: false,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        status: "idle" as const,
        variables: undefined,
        submittedAt: 0,
        reset: () => {},
        context: undefined,
      },
      registerMutation: {
        mutate: () => console.log("AuthProvider not available - register"),
        mutateAsync: async () => {
          console.log("AuthProvider not available - registerAsync");
          throw new Error("Authentication not available");
        },
        isPending: false,
        isError: false,
        error: null,
        data: undefined,
        isIdle: true,
        isSuccess: false,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        status: "idle" as const,
        variables: undefined,
        submittedAt: 0,
        reset: () => {},
        context: undefined,
      },
    } as any;
  }
  return context;
}