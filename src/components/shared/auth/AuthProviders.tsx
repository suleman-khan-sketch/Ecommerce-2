"use client";

import { FaGithub } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

type AuthProvider = "github" | "google";

type Props = {
  authType?: "Login" | "Signup";
};

export default function AuthProviders({ authType = "Login" }: Props) {
  const supabase = createBrowserClient();

  // Handle authentication with OAuth providers.
  const handleAuth = (authProvider: AuthProvider) => {
    // Use window.location.origin to get the correct URL in production
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    supabase.auth.signInWithOAuth({
      provider: authProvider,
      options: {
        redirectTo: `${origin}/auth/callback`, // Redirect URL after authentication
      },
    });
  };

  return (
    <div className="space-y-4 mb-10">
      <Button
        onClick={() => handleAuth("github")}
        variant="secondary"
        className="w-full min-h-14"
      >
        <FaGithub className="mr-3 size-4" />
        {authType} With Github
      </Button>

      <Button
        onClick={() => handleAuth("google")}
        variant="secondary"
        className="w-full min-h-14"
      >
        <FcGoogle className="mr-3 size-4" />
        {authType} With Google
      </Button>
    </div>
  );
}
