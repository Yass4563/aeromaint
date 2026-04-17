import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_PREFIX = "/api/auth";
const PUBLIC_PATHS = new Set(["/login"]);

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith(PUBLIC_API_PREFIX) || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api");
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { erreur: "Authentification requise.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/equipment/:path*",
    "/planning/:path*",
    "/tasks/:path*",
    "/kpi/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/api/:path*",
  ],
};
