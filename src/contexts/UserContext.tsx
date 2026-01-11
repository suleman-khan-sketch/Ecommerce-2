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
      // Only invalidate on sign in/out events, not on token refresh
      // TOKEN_REFRESHED happens frequently and should NOT trigger refetch
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
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
      // Use getSession() on client side - reads from local storage without API call
      // The middleware handles server-side validation with getUser()
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return { user: null, profile: null };
      }

      try {
        const { data: profile } = await supabase.rpc("get_my_profile");
        return { user: session.user, profile: profile as UserProfile };
      } catch (error: any) {
        // Handle rate limit errors gracefully
        if (error?.status === 429 || error?.message?.includes("rate limit")) {
          console.warn("Rate limit reached, using session without profile");
          return { user: session.user, profile: null };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch too often
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: false, // Prevent refetching on tab switch
    retry: false, // Don't retry failed requests to prevent rate limiting
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
