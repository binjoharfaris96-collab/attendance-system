import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  console.log("URL:", request.nextUrl.pathname);
  console.log("COOKIE HEADER:", request.headers.get("cookie"));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/apps/:path*",
  ],
};
