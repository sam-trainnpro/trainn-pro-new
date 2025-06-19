import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "../shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../client/src/lib/queryClient";

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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const { termsAccepted, ...dataToSend } = userData;
      const res = await apiRequest("POST", "/api/register", dataToSend);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
    },
  });

  const value: AuthContextType = {
    user: user ?? null,
    isLoading,
    error,
    loginMutation,
    logoutMutation,
    registerMutation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  // Provide safe fallback instead of throwing error
  if (!context) {
    console.warn("useAuth called outside AuthProvider - providing safe defaults");
    
    const safeMutation = {
      mutate: () => {},
      mutateAsync: async () => {
        throw new Error("Authentication not available");
      },
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      error: null,
      data: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status: "idle" as const,
      variables: undefined,
      submittedAt: 0,
      reset: () => {},
      context: undefined,
    };
    
    return {
      user: null,
      isLoading: false,
      error: null,
      loginMutation: safeMutation as any,
      logoutMutation: safeMutation as any,
      registerMutation: safeMutation as any,
    };
  }
  
  return context;
}