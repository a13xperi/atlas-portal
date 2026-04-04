import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_PATHS = new Set(["/", "/auth/x/callback"]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth redirect: if no token cookie and hitting a protected route, redirect to login
  const hasToken = request.cookies.has("atlas_access_token");
  if (!hasToken && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If authenticated user hits login page, redirect to dashboard
  if (hasToken && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enforce HTTPS for 1 year (includeSubDomains)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Content Security Policy
  // - default-src 'self': only allow same-origin resources by default
  // - script-src: allow self + Next.js inline scripts (unsafe-inline needed for App Router hydration)
  // - style-src: allow self + inline styles (Tailwind inlines critical CSS)
  // - img-src: allow self + data URIs (for base64 images)
  // - connect-src: allow self + Railway backend API
  // - font-src: allow self + Google Fonts (Playfair Display, Inter)
  // - frame-ancestors 'none': same as X-Frame-Options DENY but for modern browsers
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL
    ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
    : "https://api-production-9bef.up.railway.app";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      `connect-src 'self' ${apiOrigin} wss:`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return response;
}

export const config = {
  // Apply to all routes except Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
