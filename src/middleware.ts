import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/account", "/checkout"];

// Routes that require admin/staff role
const adminRoutes = ["/admin"];

// Auth routes - redirect to home if already logged in
const authRoutes = ["/login", "/signup", "/forgot-password", "/update-password"];

// Public routes that don't require any authentication
const publicRoutes = ["/", "/products"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const pathname = req.nextUrl.pathname;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isLoggedIn = !!session?.user;

  // Check if current path matches any route pattern
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute =
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) || pathname === "/";

  // If user is logged in and tries to access auth routes, redirect to home
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Public routes - allow access without authentication
  if (isPublicRoute && !isAdminRoute && !isProtectedRoute) {
    return res;
  }

  // Admin routes - require authentication and staff role
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect_to", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role
    const { data: profile } = await supabase.rpc("get_my_profile");

    if (!profile) {
      // User doesn't have a profile, redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }

    const userRole = profile?.role;

    // Only admin role can access admin routes
    if (userRole !== "admin") {
      // User is not admin, redirect to home
      return NextResponse.redirect(new URL("/", req.url));
    }

    return res;
  }

  // Protected routes (account, checkout) - require authentication
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect_to", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  // Auth routes - allow access for non-authenticated users
  if (isAuthRoute) {
    return res;
  }

  // Default: allow access
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (Supabase auth callbacks)
     * - public assets (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth|.*\\..*|assets).*)",
  ],
};
