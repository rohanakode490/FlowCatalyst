"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export const ChatInterface = ({
  onWorkflowGenerated,
}: {
  onWorkflowGenerated: (newNodes: any, newEdges: any) => void;
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [limits, setLimits] = useState({
    isPro: false,
    remaining: 2,
  });

  // Fetch initial limits
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await api.get("/ai/limits", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLimits(data);
      } catch (error) {
        toast.error("Failed to load limits");
      }
    };

    fetchLimits();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const { data } = await api.post(
        "/ai/generate",
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setLimits((prev) => ({
        ...prev,
        remaining: data.remaining,
      }));

      onWorkflowGenerated(data.nodes, data.edges);
    } catch (error: any) {
      // Handle errors
      const data = error.response.data || "";
      toast.error(
        <div className="flex flex-col space-y-1">
          <strong className="font-medium">🔒 {data.error}</strong>
          <span className="text-sm text-muted-foreground">{data.message}</span>
          {data.upgradeUrl && (
            <a
              href={data.upgradeUrl}
              className="text-primary hover:text-primary/80 hover:underline text-sm font-semibold"
            >
              Upgrade to Pro →
            </a>
          )}
        </div>,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-card border border-border rounded-md shadow-sm p-4">
      {/* Prompt Counter */}
      {!limits.isPro && (
        <div className="absolute top-2 right-2 bg-primary/10 border border-primary/20 px-2 py-1 rounded-full text-[10px] text-primary">
          <span className="font-bold">{limits.remaining}</span> prompts left
        </div>
      )}

      {/* Chat Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your workflow (e.g., 'When I get new GitHub issues, email me')"
          className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none text-sm"
          rows={3}
          disabled={loading || (!limits.isPro && limits.remaining <= 0)}
        />

        <button
          type="submit"
          disabled={loading || (!limits.isPro && limits.remaining <= 0)}
          className="w-full px-4 py-2 bg-primary text-primary-foreground border border-transparent rounded-md hover:bg-primary/90 transition-all duration-200 ease-in-out flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-primary-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <span className="font-semibold">
              Generate Workflow {!limits.isPro && limits.remaining <= 0 && "❌"}
            </span>
          )}
        </button>
      </form>

      {/* Pro Indicator */}
      {limits.isPro && (
        <div className="mt-3 text-center text-xs text-primary font-medium">
          ✨ You're on a Pro plan - unlimited prompts!
        </div>
      )}
    </div>
  );
};
