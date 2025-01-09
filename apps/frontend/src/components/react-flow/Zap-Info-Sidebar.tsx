import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import FormComponent from "@/components/react-flow/FormComponent";

interface SidebarProps {
  selectedNode: any;
  selectedNodeId: string;
  onClose: () => void;
  onChangeWebhook: () => void;
  onFormSubmit: (nodeId: string, formData: any) => void;
}

export const Sidebar = ({
  selectedNode,
  selectedNodeId,
  onClose,
  onChangeWebhook,
  onFormSubmit,
}: SidebarProps) => {
  return (
    <div className="w-96 border-l p-4 bg-background overflow-y-auto shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Configure {selectedNode.data.name}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <FormComponent
        onSubmit={(formData) => onFormSubmit(selectedNodeId, formData)}
        initialData={selectedNode.data.formData || {}}
      />
      <Button
        onClick={onChangeWebhook}
        variant="outline"
        className="w-full mt-4"
      >
        Change Webhook
      </Button>
    </div>
  );
};
