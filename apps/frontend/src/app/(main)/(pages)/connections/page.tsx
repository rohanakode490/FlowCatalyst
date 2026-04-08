"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/globals/heading";
import { googleLogout } from "@react-oauth/google";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import useStore from "@/lib/store";
import api from "@/lib/api";
import { AlertTriangle, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    google: any;
    gapi: any;
    googleCodeClient: any;
  }
}

const CONNECTIONS = [
  {
    title: "Google Sheets",
    description: "Connect your Google account to access and update Google Sheets.",
    image: "https://res.cloudinary.com/dmextegpu/image/upload/v1753959054/Google_Sheets_Logo_512px_gtxhsx.png",
  },
  {
    title: "Solana",
    description: "Connect your Solana wallet to automate SOL transfers.",
    image: "https://res.cloudinary.com/dmextegpu/image/upload/v1741162444/solana-sol-logo_fshz8v.png",
  },
];

const Connections: React.FC = () => {
  const [connections, setConnections] = useState<Record<string, boolean>>({
    "Google Sheets": false,
    Solana: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSolanaModalOpen, setIsSolanaModalOpen] = useState(false);
  const [solanaPrivateKey, setSolanaPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { user: { setRefreshToken } } = useStore();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    const checkConnections = async () => {
        try {
            const resp = await api.get("/user");
            if (mounted) {
                setConnections({
                    "Google Sheets": !!resp.data.user.googleRefreshToken,
                    Solana: !!resp.data.user.solanaPrivateKey,
                });
            }
        } catch (e) {
            console.error("Failed to fetch user connections", e);
        }
    };

    const waitForGoogle = async () => {
      if (!mounted) return;
      if (typeof window === "undefined") return;
      if (!window.google || !window.gapi) {
        setTimeout(waitForGoogle, 200);
        return;
      }

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

      window.googleCodeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope:
          "https://www.googleapis.com/auth/drive.file openid email profile",
        ux_mode: "popup",
        redirect_uri: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/callback`,
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

    checkConnections();
    waitForGoogle();
    
    return () => {
      mounted = false;
    };
  }, [setRefreshToken, router]);

  const handleSolanaConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/user/solana-key`,
        { privateKey: solanaPrivateKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConnections((prev) => ({ ...prev, Solana: true }));
      setIsSolanaModalOpen(false);
      setSolanaPrivateKey("");
    } catch (err) {
      setError("Failed to save Solana private key. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = (type: string) => {
    if (type === "Google Sheets") {
      googleLogout();
      setRefreshToken("");
    }
    setConnections((prev) => ({ ...prev, [type]: false }));
  };

  return (
    <div className="relative flex flex-col gap-4">
      <section className="flex flex-col gap-4 p-6 text-muted-foreground">
        Connect all your apps directly from here. You may need to connect
        these apps regularly to refresh verification.
        {error && <p className="text-red-500 font-medium">{error}</p>}
        
        {CONNECTIONS.map((connection) => (
          <Card key={connection.title} className="flex w-full items-center justify-between">
            <CardHeader className="flex flex-row gap-4">
              <div className="flex flex-row gap-2">
                <Image src={connection.image} alt={connection.title} height={30} width={30} className="object-contain" />
              </div>
              <div>
                <CardTitle className="text-lg">{connection.title}</CardTitle>
                <CardDescription>{connection.description}</CardDescription>
              </div>
            </CardHeader>
            <div className="flex flex-col items-center gap-2 p-4">
              {connections[connection.title] ? (
                <div className="border-primary rounded-lg border-2 px-3 py-2 font-bold text-primary flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Connected
                </div>
              ) : (
                <Button 
                  onClick={() => {
                    if (connection.title === "Solana") {
                      setIsSolanaModalOpen(true);
                    } else if (window.googleCodeClient) {
                      window.googleCodeClient.requestCode();
                    } else {
                      setError("Google auth not ready yet");
                    }
                  }}
                >
                  Connect
                </Button>
              )}
            </div>
          </Card>
        ))}
        {Object.keys(connections).some((key) => connections[key]) && (
            <div className="mt-4">
              <h2 className="text-lg font-bold">Disconnect Apps</h2>
              {CONNECTIONS.map((connection) =>
                connections[connection.title] ? (
                  <button
                    key={connection.title}
                    onClick={() => handleDisconnect(connection.title)}
                    className="m-2 rounded-lg bg-destructive p-2 font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    Disconnect {connection.title}
                  </button>
                ) : null,
              )}
            </div>
          )}
      </section>

      {/* Solana Connection Modal */}
      <Dialog open={isSolanaModalOpen} onOpenChange={setIsSolanaModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image src="https://res.cloudinary.com/dmextegpu/image/upload/v1741162444/solana-sol-logo_fshz8v.png" alt="Solana" height={24} width={24} />
              Connect Solana Wallet
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <div className="flex gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-600">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-medium">
                  <strong>WARNING:</strong> This feature is currently in the <strong>testing phase</strong>. 
                  We do not recommend using it with wallets containing significant funds yet.
                </p>
              </div>
              <p className="text-sm">
                To automate transfers, we need your Solana Private Key (Base58). 
                Your key is encrypted with AES-256-GCM before being stored.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="privateKey">Private Key (Base58)</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Enter your Solana private key"
                value={solanaPrivateKey}
                onChange={(e) => setSolanaPrivateKey(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Example: 5K... (Never share this with anyone else)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSolanaModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSolanaConnect} 
              disabled={isLoading || !solanaPrivateKey}
            >
              {isLoading ? "Saving..." : "Securely Save Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
