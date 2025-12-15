import React, { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import AuthGuard from "@/components/auth/auth-guard";

type Props = { children: React.ReactNode };

export default function Layout(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AuthGuard>
        <div className="flex overflow-hidden h-screen">
          <div className="w-full">{props.children}</div>
          <Toaster />
        </div>
      </AuthGuard>
    </Suspense>
  );
}
