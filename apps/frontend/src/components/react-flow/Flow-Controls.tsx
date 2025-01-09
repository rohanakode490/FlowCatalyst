import React from "react";
import { Button } from "@/components/ui/button";

interface FlowControlsProps {
  onAlignNodes: () => void;
}

export const FlowControls = ({ onAlignNodes }: FlowControlsProps) => {
  return (
    <Button
      onClick={onAlignNodes}
      className="self-start hover:bg-[#3F006B] hover:text-white"
    >
      Align Nodes
    </Button>
  );
};
