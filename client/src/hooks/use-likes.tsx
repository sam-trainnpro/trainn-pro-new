import React, { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useSafeAuth } from "../../../hooks/use-auth-safe";
import { useToast } from "../../../hooks/use-toast";

type LikesContextType = {
  likedClasses: number[];
  isLoading: boolean;
  error: Error | null;
  isClassLiked: (classId: number) => boolean;
  likeMutation: UseMutationResult<any, Error, number>;
  unlikeMutation: UseMutationResult<any, Error, number>;
};

export const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user } = useSafeAuth();
  const { toast } = useToast();

  // Fetch user's liked classes
  const {
    data: likedClasses = [],
    error,
    isLoading,
  } = useQuery<number[], Error>({
    queryKey: ["/api/user/liked-classes"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // Only fetch if user is logged in
  });

  // Function to check if a class is liked
  const isClassLiked = (classId: number): boolean => {
    return likedClasses.includes(classId);
  };

  // Like a class mutation
  const likeMutation = useMutation({
    mutationFn: async (classId: number) => {
      const res = await apiRequest("POST", `/api/classes/${classId}/like`);
      return await res.json();
    },
    onSuccess: (_, classId) => {
      // Update the cache by adding the class ID to the liked classes array
      queryClient.setQueryData(["/api/user/liked-classes"], (oldData: number[] = []) => {
        if (!oldData.includes(classId)) {
          return [...oldData, classId];
        }
        return oldData;
      });
      
      toast({
        title: "Class liked!",
        description: "Added to your favorites",
      });
    },
    onError: (error) => {
      console.error("Error liking class:", error);
      toast({
        title: "Error",
        description: "Failed to like class. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unlike a class mutation
  const unlikeMutation = useMutation({
    mutationFn: async (classId: number) => {
      const res = await apiRequest("DELETE", `/api/classes/${classId}/like`);
      return await res.json();
    },
    onSuccess: (_, classId) => {
      // Update the cache by removing the class ID from the liked classes array
      queryClient.setQueryData(["/api/user/liked-classes"], (oldData: number[] = []) => {
        return oldData.filter(id => id !== classId);
      });
      
      toast({
        title: "Class unliked",
        description: "Removed from your favorites",
      });
    },
    onError: (error) => {
      console.error("Error unliking class:", error);
      toast({
        title: "Error",
        description: "Failed to unlike class. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <LikesContext.Provider
      value={{
        likedClasses: likedClasses || [],
        isLoading,
        error,
        isClassLiked,
        likeMutation,
        unlikeMutation,
      }}
    >
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  
  if (context === undefined) {
    throw new Error("useLikes must be used within a LikesProvider");
  }
  
  return context;
}

// Safe version for use in components that might not have the provider
export function useSafeLikes() {
  const context = useContext(LikesContext);
  
  if (context === undefined) {
    // Return a safe fallback when LikesProvider is not available
    return {
      likedClasses: [],
      isLoading: false,
      error: null,
      isClassLiked: () => false,
      likeMutation: {
        mutate: () => {},
        mutateAsync: async () => { throw new Error("LikesProvider not available"); },
        isPending: false,
        isError: false,
        error: null,
      },
      unlikeMutation: {
        mutate: () => {},
        mutateAsync: async () => { throw new Error("LikesProvider not available"); },
        isPending: false,
        isError: false,
        error: null,
      },
    };
  }
  
  return context;
}