import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

type Props = { children: React.ReactNode };

export default function Layout(props: Props) {

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return <div>Error: Google Client ID is missing. Please check your .env.local file.</div>;
  }
  return (

    <GoogleOAuthProvider clientId={clientId}>
      <div className="border-l-[1px] border-t-[1px] pb-20 h-screen rounded-l-3xl border-muted-foreground/20">
        {props.children}
      </div>
    </GoogleOAuthProvider>
  );
}
