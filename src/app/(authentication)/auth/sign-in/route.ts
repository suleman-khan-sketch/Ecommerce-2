import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { loginFormSchema } from "@/app/(authentication)/login/_components/schema";
import validateFormData from "@/helpers/validateFormData";

export async function POST(request: Request) {
  const cookieStore = cookies();

  // Store cookies to be set in the response
  const cookiesToSet: {
    name: string;
    value: string;
    options: CookieOptions;
  }[] = [];

  // Create Supabase client with proper cookie handling for production
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookiesToSet.push(cookie);
          });
        },
      },
    }
  );

  // Get form fields
  const { email, password } = await request.json();

  // Server side form validation
  const { errors } = validateFormData(loginFormSchema, {
    email,
    password,
  });

  // If there are validation errors, return a JSON response with the errors and a 401 status.
  if (errors) {
    return NextResponse.json({ errors }, { status: 401 });
  }

  // Attempt to sign in the user with the provided email and password using Supabase's signInWithPassword method.
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If there is an error during sign-in, return a JSON response with the error message and a 401 status.
  if (error) {
    return NextResponse.json(
      {
        errors: {
          password: error.message,
        },
      },
      { status: 401 }
    );
  }

  // Create response and set cookies on it
  const response = NextResponse.json({ success: true });

  // Set all cookies on the response with proper production settings
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      // Ensure cookies work in production HTTPS
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  });

  return response;
}
