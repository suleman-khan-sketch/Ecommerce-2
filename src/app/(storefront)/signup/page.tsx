import { Metadata } from "next";
import Link from "next/link";

import { SITE_CONFIG } from "@/constants/site";
import CustomerSignupForm from "./_components/CustomerSignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: `Create your ${SITE_CONFIG.name} account to start shopping`,
};

export default function CustomerSignupPage() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Create Your Account</h1>
        <p className="mt-2 text-muted-foreground">
          Join {SITE_CONFIG.name} to start shopping
        </p>
      </div>

      <CustomerSignupForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
