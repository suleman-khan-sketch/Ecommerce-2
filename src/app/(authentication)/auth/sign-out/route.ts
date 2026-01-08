import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { siteUrl } from "@/constants/siteUrl";

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Sign the user out by invoking the signOut method of the Supabase auth client.
  await supabase.auth.signOut();

  // Redirect the user to the login page.
  return NextResponse.redirect(`${siteUrl}/login`, {
    // a 301 status is required to redirect from a POST to a GET route
    status: 301,
  });
}

// Also handle GET requests for sign-out (in case of direct navigation)
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Sign the user out
  await supabase.auth.signOut();

  // Redirect the user to the login page
  return NextResponse.redirect(`${siteUrl}/login`, {
    status: 302,
  });
}
