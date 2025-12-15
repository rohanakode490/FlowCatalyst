import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Only handle OAuth redirects with token in URL
  // Actual route protection is handled by AuthGuard component (client-side)
  // This is because cookies from Node.js backend cannot be read by Next.js middleware
  // due to cross-origin restrictions and httpOnly flags

  const tokenFromUrl = req.nextUrl.searchParams.get("token");

  // If token is in URL (OAuth redirect), allow through
  // The client-side AuthGuard component will handle storing it and authentication
  if (tokenFromUrl) {
    return NextResponse.next();
  }

  // For all other requests, let them through
  // AuthGuard component will check localStorage and redirect if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/connections/:path*",
    "/flow/:path*",
    "/flow/create/:path*",
    "/settings/:path*",
    "/workflows/:path*",
    "/callback/:path*",
  ], // Protect these routes
};
