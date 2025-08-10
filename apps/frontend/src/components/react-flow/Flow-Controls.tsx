import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useStore from "@/lib/store";
import { Node } from "@xyflow/react";

interface FlowControlsProps {
  onAlignNodes: () => void;
  zapId?: string;
}

export const FlowControls = ({ onAlignNodes, zapId }: FlowControlsProps) => {
  const router = useRouter();
  const {
    flow: { saveZap, nodes },
    form: { isSubmitting },
    ui: { addToast },
  } = useStore();

  // Check if all nodes are configured
  const isSaveDisabled = nodes.some((node) => !node.data.configured);

  // Function to save the flow to the Zap database
  const handleSaveFlow = async () => {
    try {
      const triggerNode = nodes.find((node: Node) => !node.data.action);
      console.log("triggerNode", triggerNode)
      const response = await saveZap(zapId, triggerNode?.data.name);

      // Redirect to the dashboard after saving
      if (response) {
        addToast("Zap saved successfully!", "success");
        router.push("/workflows");
      }
    } catch (error: any) {
      console.error("Failed to save Zap:", error);
      if (error.response) {
        console.error("Failed to save Zap:", error);
        addToast("Failed to save Zap. Please try again.", "error");
      }
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
        disabled={isSaveDisabled || isSubmitting} // Combined disabled states
      >
        {isSubmitting ? "Saving..." : "Save Flow"} {/* Show loading state */}
      </Button>
    </div>
  );
};
