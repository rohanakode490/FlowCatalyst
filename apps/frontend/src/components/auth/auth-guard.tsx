"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useStore from "@/lib/store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const {
    user: { isAuthenticated, fetchUser, setRefreshToken },
  } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      // Check for token in URL (OAuth redirects)
      const tokenFromUrl = searchParams.get("token");
      const refreshTokenFromUrl = searchParams.get("refresh_token");

      // If token is in URL, store it in localStorage
      if (tokenFromUrl) {
        localStorage.setItem("token", tokenFromUrl);
        // Remove token from URL to clean it up
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("token");
        router.replace(newUrl.pathname + newUrl.search);
      }

      // Handle refresh token from URL (Google Sheets connection)
      if (refreshTokenFromUrl && typeof refreshTokenFromUrl === "string") {
        setRefreshToken(refreshTokenFromUrl);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("refresh_token");
        router.replace(newUrl.pathname + newUrl.search);
      }

      // Check if token exists in localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        // No token found, redirect to login
        router.replace("/login");
        return;
      }

      // If user data hasn't been fetched yet, fetch it
      if (!isAuthenticated) {
        try {
          const resp = await fetchUser();
          if (resp !== 200) {
            router.push("/login");
          }
        } catch (error) {
          // If fetch fails, token might be invalid
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, fetchUser, router, searchParams, setRefreshToken]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated after checking, don't render children
  // (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
