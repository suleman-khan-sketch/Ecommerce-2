import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  // Find Supabase auth cookies
  const authCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only for debugging
        },
      },
    }
  );

  let userData = null;
  let userError = null;
  let sessionData = null;
  let sessionError = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    userData = data;
    userError = error ? { message: error.message, status: error.status } : null;
  } catch (e: any) {
    userError = { message: e.message };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    sessionData = data;
    sessionError = error ? { message: error.message } : null;
  } catch (e: any) {
    sessionError = { message: e.message };
  }

  return NextResponse.json({
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
    cookies: {
      total: allCookies.length,
      authCookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length })),
    },
    auth: {
      user: userData?.user ? { id: userData.user.id, email: userData.user.email } : null,
      userError,
      session: sessionData?.session ? { 
        expires_at: sessionData.session.expires_at,
        token_type: sessionData.session.token_type,
      } : null,
      sessionError,
    },
  });
}
