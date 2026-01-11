import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { passwordResetFormSchema } from "@/app/(authentication)/forgot-password/_components/schema";
import validateFormData from "@/helpers/validateFormData";

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Get form fields
  const { email } = await request.json();

  // Server side form validation
  const { errors } = validateFormData(passwordResetFormSchema, {
    email,
  });

  // If there are validation errors, return a JSON response with the errors and a 401 status.
  if (errors) {
    return NextResponse.json({ errors }, { status: 401 });
  }

  // Use the request origin for redirect URL
  const origin = request.nextUrl.origin;

  // Attempt to reset the password for the provided email using Supabase's resetPasswordForEmail method.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/update-password`, // Redirect URL when the "reset password" link is clicked on the email
  });

  // If there is an error during the password reset, return a JSON response with the error message and a 401 status.
  if (error) {
    return NextResponse.json(
      {
        errors: {
          email: error.message,
        },
      },
      { status: 401 }
    );
  }

  // If the password reset is successful, return a JSON response indicating success.
  return NextResponse.json({ success: true });
}
