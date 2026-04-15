import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("rollcall_session")?.value;
  let hasSession = false;
  let role = "admin"; // Default fallback

  if (sessionCookie) {
    hasSession = true;
    const [encodedPayload] = sessionCookie.split(".");
    if (encodedPayload) {
      try {
        // Base64url decode manually for edge compatibility
        const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        if (payload.role) {
          role = payload.role;
        }
      } catch (e) {
        // Ignore decode errors; real auth validation happens server-side
      }
    }
  }

  // 1. Unauthenticated users get kicked to login
  const isProtectedPath = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/student") || 
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/apps");

  if (isProtectedPath && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    // If logged in, send them to their role's home page
    if (role === "student") return NextResponse.redirect(new URL("/student", request.url));
    if (role === "teacher") return NextResponse.redirect(new URL("/teacher", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Role-based enclosure (prevent crossing portals)
  if (hasSession) {
    if (role === "student" && !pathname.startsWith("/student")) {
      return NextResponse.redirect(new URL("/student", request.url));
    }
    if (role === "teacher" && !pathname.startsWith("/teacher")) {
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
    if (role === "admin" && (pathname.startsWith("/student") || pathname.startsWith("/teacher"))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/apps/:path*",
    "/login",
    "/signup"
  ],
};
