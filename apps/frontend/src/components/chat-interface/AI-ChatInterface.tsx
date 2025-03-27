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
      console.log("prompt", prompt);
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

      console.log("data", data);

      setLimits((prev) => ({
        ...prev,
        remaining: data.remaining,
      }));

      onWorkflowGenerated(data.nodes, data.edges);
    } catch (error: any) {
      // Handle errors
      console.log("errrrrr", error);
      const data = error.response.data || "";
      toast.error(
        <div className="flex flex-col space-y-1">
          <strong className="font-medium">🔒 {data.error}</strong>
          <span className="text-sm text-gray-600">{data.message}</span>
          {data.upgradeUrl && (
            <a
              href={data.upgradeUrl}
              className="text-blue-500 hover:text-blue-600 hover:underline text-sm"
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
    <div className="relative bg-[#f9fafb] dark:bg-[#02081f] border border-[#e5e7eb] dark:border-[#1f2937] rounded-md shadow-sm p-4">
      {/* Prompt Counter */}
      {!limits.isPro && (
        <div className="absolute top-2 right-2 bg-[#f9fafb] dark:bg-[#1f2937] px-2 py-1 rounded-full text-xs text-[#505050] dark:text-gray-300">
          <span className="font-medium">{limits.remaining}</span> prompts left
        </div>
      )}

      {/* Chat Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your workflow (e.g., 'When I get new GitHub issues, email me')"
          className="w-full p-2 border border-[#e5e7eb] dark:border-[#374151] rounded-md bg-white dark:bg-[#1f2937] text-[#111827] dark:text-gray-100 placeholder-[#9ca3af] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          rows={3}
          disabled={loading || (!limits.isPro && limits.remaining <= 0)}
        />

        <button
          type="submit"
          disabled={loading || (!limits.isPro && limits.remaining <= 0)}
          className="w-full px-4 py-2 bg-[#f9fafb] dark:bg-[#1f2937] text-[#505050] dark:text-gray-300 border border-[#e5e7eb] dark:border-[#374151] rounded-md hover:bg-[#d1d5db] dark:hover:bg-[#374151] hover:text-white dark:hover:text-white transition-all duration-200 ease-in-out flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-[#505050] dark:text-gray-300"
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
            <span>
              Generate Workflow {!limits.isPro && limits.remaining <= 0 && "❌"}
            </span>
          )}
        </button>
      </form>

      {/* Pro Indicator */}
      {limits.isPro && (
        <div className="mt-3 text-center text-xs text-[#9ca3af] dark:text-gray-400">
          ✨ You're on a Pro plan - unlimited prompts!
        </div>
      )}
    </div>
  );
};
