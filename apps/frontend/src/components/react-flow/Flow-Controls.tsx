import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface FlowControlsProps {
  onAlignNodes: () => void;
  nodes: any[];
  edges: any[];
  zapId?: string;
  triggerData?: Record<string, any>;
}

export const FlowControls = ({
  onAlignNodes,
  nodes,
  zapId,
  triggerData,
}: FlowControlsProps) => {
  // Check if all nodes are configured
  const isSaveDisabled = nodes.some((node) => !node.data.configured);
  const router = useRouter();

  const mapTriggerDataToAction = (
    actionConfig: any,
    triggerData: Record<string, any>,
  ) => {
    const mappedConfig = { ...actionConfig };

    // Replace variables in the action config with trigger data
    for (const key in mappedConfig) {
      if (typeof mappedConfig[key] === "string") {
        mappedConfig[key] = mappedConfig[key].replace(
          /{{trigger\.(.*?)}}/g,
          (_, variable) => triggerData[variable] || "",
        );
      }
    }

    return mappedConfig;
  };

  // Function to save the flow to the Zap database
  const handleSaveFlow = async () => {
    try {
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
          actionMetadata: mapTriggerDataToAction(
            node.data.metadata,
            triggerData,
          ), // Optional metadata
        })),
      };

      const isEditing = !!zapId;

      // Send/Update data to the backend
      const response = isEditing
        ? await api.put(`/zap/${zapId}`, zapData, {
            headers: {
              Authorization: localStorage.getItem("token"),
            },
          })
        : await api.post("/zap", zapData, {
            headers: {
              Authorization: localStorage.getItem("token"),
            },
          });

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
        disabled={isSaveDisabled}
      >
        Save Flow
      </Button>
    </div>
  );
};
