"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/globals/heading";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import useStore from "@/lib/store";
import api from "@/lib/api";

const CONNECTIONS = [
  {
    title: "Google Sheets",
    description:
      "Connect your Google account to access and update Google Sheets.",
    image:
      "https://res.cloudinary.com/dmextegpu/image/upload/v1753959054/Google_Sheets_Logo_512px_gtxhsx.png",
  },
];

interface ConnectionCardProps {
  title: string;
  description: string;
  icon: string;
  type: string;
  connected: Record<string, boolean>;
  onConnect: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  title,
  description,
  icon,
  type,
  connected,
  onConnect,
}) => {
  return (
    <Card className="flex w-full items-center justify-between">
      <CardHeader className="flex flex-row gap-4">
        <div className="flex flex-row gap-2">
          <Image
            src={icon}
            alt={title}
            height={30}
            width={30}
            className="object-contain"
          />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <div className="flex flex-col items-center gap-2 p-4">
        {connected[type] ? (
          <div className="border-bg-primary rounded-lg border-2 px-3 py-2 font-bold text-white">
            Connected
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="rounded-lg bg-primary p-2 font-bold text-primary-foreground"
          >
            Connect
          </button>
        )}
      </div>
    </Card>
  );
};

const Connections: React.FC = () => {
  const [connections, setConnections] = useState<Record<string, boolean>>({
    "Google Sheets": false,
  });
  const [error, setError] = useState<string | null>(null);
  const {
    user: { refreshToken, setRefreshToken },
  } = useStore();
  const router = useRouter();

  // const login = useGoogleLogin({
  //   onSuccess: async (codeResponse) => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       const response = await api.post(
  //         `/sheets`,
  //         {
  //           code: codeResponse.code,
  //         },
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         },
  //       );
  //       setRefreshToken(response.data.refresh_token);
  //       setConnections((prev) => ({ ...prev, "Google Sheets": true }));
  //       setError(null);
  //       router.push("/workflows");
  //     } catch (err) {
  //       setError("Failed to authenticate with Google Sheets");
  //     }
  //   },
  //   onError: () => {
  //     setError("Google authentication failed");
  //   },
  //   flow: "auth-code",
  //   scope: "https://www.googleapis.com/auth/drive.readonly",
  //   redirect_uri: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/callback`,
  // });

  const handleDisconnect = (type: string) => {
    if (type === "Google Sheets") {
      googleLogout();
      setRefreshToken("");
    }
    setConnections((prev) => ({ ...prev, [type]: false }));
  };

  useEffect(() => {
    let mounted = true;
    const waitForGoogle = async () => {
      if (!mounted) return;
      if (typeof window === "undefined") return;
      if (!window.google || !window.gapi) {
        // keep polling until scripts load
        setTimeout(waitForGoogle, 200);
        return;
      }

      // init gapi client (optional but helpful)
      try {
        await new Promise<void>((resolve) =>
          window.gapi.load("client", resolve),
        );
        await window.gapi.client.init({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
          discoveryDocs: [
            "https://sheets.googleapis.com/$discovery/rest?version=v4",
          ],
        });
      } catch (e) {
        console.warn("gapi init failed", e);
      }

      // init code client
      window.googleCodeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope:
          "https://www.googleapis.com/auth/drive.file openid email profile",
        ux_mode: "popup",
        redirect_uri: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/callback`,
        // callback receives { code }
        callback: async (resp: any) => {
          if (!resp || !resp.code) {
            setError("No code received from Google");
            return;
          }
          try {
            const token = localStorage.getItem("token");
            const response = await api.post(
              `/sheets`,
              { code: resp.code },
              { headers: { Authorization: `Bearer ${token}` } },
            );
            // backend should return refresh_token
            setRefreshToken(response.data.refresh_token || "");
            setConnections((prev) => ({ ...prev, "Google Sheets": true }));
            setError(null);
            router.push("/workflows");
          } catch (err) {
            console.error("Token exchange error:", err);
            setError("Failed to authenticate with Google Sheets");
          }
        },
      });
    };

    waitForGoogle();
    return () => {
      mounted = false;
    };
  }, [setRefreshToken, router]);

  return (
    <div className="relative flex flex-col gap-4">
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col gap-4 p-6 text-muted-foreground">
          Connect all your apps directly from here. You may need to connect
          these apps regularly to refresh verification.
          {error && <p className="text-red-500">{error}</p>}
          {CONNECTIONS.map((connection) => (
            <ConnectionCard
              key={connection.title}
              description={connection.description}
              title={connection.title}
              icon={connection.image}
              type={connection.title}
              connected={connections}
              onConnect={() => {
                if ((window as any).googleCodeClient) {
                  (window as any).googleCodeClient.requestCode();
                } else {
                  setError("Google auth not ready yet");
                }
              }}
            />
          ))}
          {Object.keys(connections).some((key) => connections[key]) && (
            <div className="mt-4">
              <h2 className="text-lg font-bold">Disconnect Apps</h2>
              {CONNECTIONS.map((connection) =>
                connections[connection.title] ? (
                  <button
                    key={connection.title}
                    onClick={() => handleDisconnect(connection.title)}
                    className="m-2 rounded-lg bg-red-500 p-2 font-bold text-white"
                  >
                    Disconnect {connection.title}
                  </button>
                ) : null,
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default function ConnectionsPage() {
  return (
    <Header heading="Connections">
      <Connections />
    </Header>
  );
}
