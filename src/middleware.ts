import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicOrigins } from "@/lib/public-urls";

// Public routes that don't require authentication
const PUBLIC_PATHS = new Set(["/", "/auth/x/callback", "/auth/callback", "/onboarding"]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/onboarding") || pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/style-tile.html";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth redirect: check for the session flag cookie (set client-side after login).
  // The real auth token lives on the backend domain (cross-origin HttpOnly cookie),
  // so we use a lightweight flag cookie on the frontend domain as a hint.
  const hasSession = request.cookies.has("atlas_session");
  if (!hasSession && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If authenticated user hits login page, redirect to dashboard
  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  // Prevent clickjacking (allow self-framing for admin style tile)
  if (pathname.startsWith("/admin/style-tile") || pathname === "/style-tile.html") {
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
  } else {
    response.headers.set("X-Frame-Options", "DENY");
  }

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
    "camera=(), microphone=(self), geolocation=(), payment=()"
  );

  // Content Security Policy
  // - default-src 'self': only allow same-origin resources by default
  // - script-src: allow self + Next.js inline scripts (unsafe-inline needed for App Router hydration)
  // - style-src: allow self + inline styles (Tailwind inlines critical CSS)
  // - img-src: allow self + data URIs (for base64 images)
  // - connect-src: allow self + Railway backend API
  // - font-src: allow self + Google Fonts (Playfair Display, Inter)
  // - frame-ancestors 'none': same as X-Frame-Options DENY but for modern browsers
  const styleSrc = [
    "style-src 'self' 'unsafe-inline'",
    publicOrigins.googleFontsStylesOrigin,
  ]
    .filter(Boolean)
    .join(" ");

  const imgSrc = [
    "img-src 'self' data: blob:",
    publicOrigins.xImageCdnOrigin,
    publicOrigins.unavatarOrigin,
  ]
    .filter(Boolean)
    .join(" ");

  const connectSrc = [
    "connect-src 'self'",
    publicOrigins.apiOrigin,
    publicOrigins.supabaseOrigin,
    "wss:",
  ]
    .filter(Boolean)
    .join(" ");

  const fontSrc = [
    "font-src 'self'",
    publicOrigins.googleFontsAssetsOrigin,
  ]
    .filter(Boolean)
    .join(" ");

  // TODO(H-2): Migrate script-src off 'unsafe-inline' by adopting per-request
  // nonces for Next.js App Router hydration scripts (see follow-up ticket
  // H-2-nonce-migration). 'unsafe-eval' has been removed — Next.js 14 App
  // Router does not require it in production builds.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      styleSrc,
      imgSrc,
      connectSrc,
      fontSrc,
      "frame-ancestors 'self'",
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
