"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useStore from "@/lib/store";
import api from "@/lib/api";

interface GooglePickerProps {
  onSelect: (spreadsheetId: string, title: string) => void;
  disabled?: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "drive-picker": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "client-id": string;
          "app-id": string;
          token?: string;
          "developer-key"?: string;
        },
        HTMLElement
      >;
      "drive-picker-docs-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "view-id"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export default function GooglePicker({
  onSelect,
  disabled = false,
}: GooglePickerProps) {
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const {
    user: { refreshToken },
  } = useStore();

  useEffect(() => {
    if (showPicker && accessToken) {
      const pickerElement = document.querySelector("drive-picker") as any;
      if (pickerElement) {
        // Set up event listeners
        const handlePicked = (event: any) => {
          const docs = event.detail?.docs || [];
          if (docs.length > 0) {
            const doc = docs[0];
            onSelect(doc.id, doc.name);
          }
          setShowPicker(false);
          setAccessToken(null);
        };

        const handleCanceled = () => {
          setShowPicker(false);
          setAccessToken(null);
        };

        pickerElement.addEventListener("picker:picked", handlePicked);
        pickerElement.addEventListener("picker:canceled", handleCanceled);

        // Cleanup
        return () => {
          pickerElement.removeEventListener("picker:picked", handlePicked);
          pickerElement.removeEventListener("picker:canceled", handleCanceled);
        };
      }
    }
  }, [showPicker, accessToken, onSelect]);

  useEffect(() => {
    import("@googleworkspace/drive-picker-element");
  }, []);

  const handleOpenPicker = useCallback(async () => {
    if (!refreshToken) {
      alert("Please connect Google Sheets in Connections page first.");
      return;
    }

    try {
      setIsLoadingToken(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in first");
        return;
      }

      // Get access token from backend
      const response = await api.get("/sheets/token", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.access_token) {
        throw new Error("No access token received");
      }

      setAccessToken(response.data.access_token);
      setShowPicker(true);
    } catch (error: any) {
      console.error("Error opening Google Picker:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to get access token";
      alert(`Failed to open Google Picker: ${errorMessage}`);
    } finally {
      setIsLoadingToken(false);
    }
  }, [refreshToken]);

  if (!refreshToken) {
    return (
      <div className="text-sm text-muted-foreground">
        Please connect Google Sheets in Connections page first.
      </div>
    );
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const developerKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  return (
    <>
      <Button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled || isLoadingToken}
        variant="outline"
      >
        {isLoadingToken ? "Loading..." : "Pick from Google Drive"}
      </Button>

      {showPicker && accessToken && clientId && (
        <drive-picker
          client-id={clientId}
          app-id={clientId}
          token={accessToken}
          developer-key={developerKey}
          style={{ display: "none" }}
        >
          <drive-picker-docs-view view-id="SPREADSHEETS" />
        </drive-picker>
      )}
    </>
  );
}
