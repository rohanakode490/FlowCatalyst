import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface FlowControlsProps {
  onAlignNodes: () => void;
  nodes: any[];
  edges: any[];
  zapId?: string;
}

export const FlowControls = ({
  onAlignNodes,
  nodes,
  zapId,
}: FlowControlsProps) => {
  // Check if all nodes are configured
  const [loading, setLoading] = useState(false);
  const isSaveDisabled = nodes.some((node) => !node.data.configured);
  const router = useRouter();

  // Function to save the flow to the Zap database
  const handleSaveFlow = async () => {
    try {
      setLoading(true);
      // Extract trigger and actions from nodes
      const triggerNode = nodes.find((node) => !node.data.action); // Trigger node has action: false
      const actionNodes = nodes.filter((node) => node.data.action); // Action nodes have action: true

      // Validate that a trigger and at least one action are present
      if (!triggerNode || actionNodes.length === 0) {
        alert("A flow must have at least one trigger and one action.");
        return;
      }

      // Prepare data for the backend
      const zapData = {
        availableTriggerId: triggerNode.data.id, // Assuming the trigger node has an ID
        triggerMetadata: triggerNode.data.metadata, // Optional metadata
        actions: actionNodes.map((node) => ({
          availableActionId: node.data.id, // Assuming the action node has an ID
          actionMetadata: node.data.metadata,
        })),
      };

      const isEditing = !!zapId;

      // Send/Update data to the backend
      const token = localStorage.getItem("token");
      const response = isEditing
        ? await api.put(`/zap/${zapId}`, zapData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        : await api.post(
            "/zap",
            { scraperType: triggerNode.data.metadata.type, zapData: zapData },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
      // Redirect to the dashboard after saving
      if (response.data.zapId || response.data.success) {
        router.push("/workflows");
      }
    } catch (error: any) {
      console.error("Failed to save Zap:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      alert("Failed to save Zap. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={onAlignNodes}
        className="self-start hover:bg-[#3F006B] hover:text-white"
      >
        Align Nodes
      </Button>
      <Button
        onClick={handleSaveFlow}
        className="self-start hover:bg-[#3F006B] hover:text-white"
        disabled={isSaveDisabled || loading} // Combined disabled states
      >
        {loading ? "Saving..." : "Save Flow"} {/* Show loading state */}
      </Button>
    </div>
  );
};
