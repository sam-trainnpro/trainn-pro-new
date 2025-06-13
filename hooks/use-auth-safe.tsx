import { useAuth } from "./use-auth-simple";

export function useSafeAuth() {
  try {
    return useAuth();
  } catch (error) {
    // Return a safe fallback when AuthProvider is not available
    return {
      user: null,
      isLoading: false,
      error: null,
      loginMutation: {
        mutate: () => {},
        mutateAsync: async () => { throw new Error("AuthProvider not available"); },
        isPending: false,
        isError: false,
        error: null,
      },
      logoutMutation: {
        mutate: () => {},
        mutateAsync: async () => { throw new Error("AuthProvider not available"); },
        isPending: false,
        isError: false,
        error: null,
      },
      registerMutation: {
        mutate: () => {},
        mutateAsync: async () => { throw new Error("AuthProvider not available"); },
        isPending: false,
        isError: false,
        error: null,
      },
    };
  }
}