import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const tokenFromCookie = req.cookies.get("token")?.value;

  const token = tokenFromCookie;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/connections/:path*",
    "/flow/:path*",
    "/settings/:path*",
    "/workflows/:path*",
  ], // Protect these routes
};
