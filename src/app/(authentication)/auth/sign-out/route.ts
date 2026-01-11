import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

  // Sign the user out by invoking the signOut method of the Supabase auth client.
  await supabase.auth.signOut();

  // Use the request origin for redirect
  const origin = request.nextUrl.origin;

  // Redirect the user to the login page.
  return NextResponse.redirect(`${origin}/login`, {
    // a 301 status is required to redirect from a POST to a GET route
    status: 301,
  });
}

// Also handle GET requests for sign-out (in case of direct navigation)
export async function GET(request: NextRequest) {
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

  // Sign the user out
  await supabase.auth.signOut();

  // Use the request origin for redirect
  const origin = request.nextUrl.origin;

  // Redirect the user to the login page
  return NextResponse.redirect(`${origin}/login`, {
    status: 302,
  });
}
