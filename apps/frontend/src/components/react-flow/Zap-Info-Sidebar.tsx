import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ACTION_FORM_FIELDS, TRIGGER_FORM_FIELDS } from "@/lib/constant";
import DynamicForm from "@/components/forms/flow-form";
import { ACTION_SCHEMAS, TRIGGER_SCHEMAS } from "@/lib/schema";
import useStore from "@/lib/store";

interface SidebarProps {
  selectedNode: any;
  onClose: () => void;
  openDialog: () => void;
  onFormSubmit: (nodeId: string, formData: Record<string, any>) => void;
  handleTriggerTypeChange?: (triggerId: string) => void;
}

export const Sidebar = ({
  selectedNode,
  onClose,
  openDialog,
  onFormSubmit,
}: SidebarProps) => {
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const {
    flow: { selectedNodeId, triggerName },
  } = useStore();

  const formFields = selectedNode.data.action
    ? ACTION_FORM_FIELDS[selectedNode.data.name.toLowerCase().replace(" ", "")] || []
    : TRIGGER_FORM_FIELDS[selectedNode.data.name.toLowerCase().replace(" ", "")] || [];

  const schema = selectedNode.data.action
    ? ACTION_SCHEMAS[selectedNode.data.name.toLowerCase().replace(" ", "")] || []
    : TRIGGER_SCHEMAS[selectedNode.data.name.toLowerCase().replace(" ", "")] || [];

  // Get the initial data from the node's metadata field
  const initialData = selectedNode.data.metadata;

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !sidebarRef.current) return;

      const newWidth =
        sidebarRef.current.getBoundingClientRect().right - e.clientX;
      if (newWidth >= 300 && newWidth <= 600) {
        sidebarRef.current.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDown = () => {
      isResizing.current = true;
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    const resizeHandle = sidebarRef.current?.querySelector(".resize-handle");
    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function findTriggerType(triggerName: any) {
    if (triggerName?.hasOwnProperty("githubEventType")) {
      return "github";
    } else if (
      triggerName?.hasOwnProperty("type") &&
      triggerName["type"] === "LINKEDIN_JOBS"
    ) {
      return "linkedin";
    } else if (triggerName?.hasOwnProperty("type") && triggerName["type"] === "INDEED_JOBS") {
      return "indeed";
    }
  }

  function findActionType(selectedNode: any) {
    if (selectedNode.data.action) {
      const name = selectedNode.data.name.toLowerCase().replace(" ", "");
      return name;
    }
    else {
      return "";
    }
  }

  return (
    <div
      ref={sidebarRef}
      className="w-96 h-full border-l bg-background shadow-lg flex flex-col relative"
    >
      {/* Resize Handle */}
      <div className="resize-handle absolute top-0 bottom-0 left-0 w-2 cursor-col-resize hover:bg-gray-300 transition-colors" />
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Configure {selectedNode.data.name}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <DynamicForm
          fields={formFields}
          initialData={initialData}
          onSubmit={(formData) => onFormSubmit(selectedNodeId, formData)}
          schema={schema}
          triggerType={findTriggerType(triggerName)}
          actionType={findActionType(selectedNode)}
          onClose={onClose}
          nodeId={selectedNode.id}
        />
        <div className="border-t">
          <Button
            onClick={openDialog}
            variant="outline"
            className="w-full mt-4"
          >
            Change Webhook
          </Button>
        </div>
      </div>
    </div>
  );
};
