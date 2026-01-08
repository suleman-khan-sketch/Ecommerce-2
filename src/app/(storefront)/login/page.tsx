import { Metadata } from "next";
import Link from "next/link";

import { SITE_CONFIG } from "@/constants/site";
import CustomerLoginForm from "./_components/CustomerLoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to your ${SITE_CONFIG.name} account`,
};

export default function CustomerLoginPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to your {SITE_CONFIG.name} account
        </p>
      </div>

      <CustomerLoginForm />

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}
