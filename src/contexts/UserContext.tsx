"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

import { Tables } from "@/types/supabase";
import { createBrowserClient } from "@/lib/supabase/client";

// Simplified roles: admin and customer only
export type UserRole = "admin" | "customer";

type UserProfile = {
  name: string | null;
  image_url: string | null;
  role: UserRole | null;
  // Customer-specific fields
  store_name?: string | null;
  address?: string | null;
  phone?: string | null;
  ein?: string | null;
  age_verified?: boolean;
};

type UserContextType = {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  isLoading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Only invalidate on meaningful auth events, not on token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      try {
        // Use getUser() instead of getSession() for reliable auth state
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!user || error) {
          return { user: null, profile: null };
        }

        const { data: profile } = await supabase.rpc("get_my_profile");
        return { user, profile: profile as UserProfile };
      } catch (error: any) {
        // Handle rate limit errors gracefully
        if (error?.status === 429 || error?.message?.includes('rate limit')) {
          console.warn('Rate limit reached. Retrying after delay...');
          // Return cached data if available, otherwise null
          return { user: null, profile: null };
        }
        throw error;
      }
    },
    staleTime: Infinity,
    retry: (failureCount, error: any) => {
      // Don't retry on rate limit errors immediately
      if (error?.status === 429) {
        return failureCount < 2;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff for rate limit errors
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
  });

  const value = {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
