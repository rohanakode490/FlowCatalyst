import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";

interface NodeData {
  configured: boolean;
  onOpenDialog: () => void;
  action: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  image: string;
  name: string;
}

interface CustomNodeProps {
  id: string;
  data: NodeData;
}

const CustomNode = memo(({ data, id }: CustomNodeProps) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const handleNodeClick = () => {
    if (!data.configured) {
      data.onOpenDialog(); // Open the dialog for webhook selection
    }
  };
  if (data.image) {
    const img = new Image();
    img.src = data.image;
  }
  return (
    <>
      <div
        className="w-48 h-20 rounded-md border-2 shadow-md flex items-center justify-around px-3 bg-card border-border"
        onClick={handleNodeClick}
      >
        {/* Delete button */}
        {data.action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.canDelete) {
                data.onDelete(id);
              } else {
                alert("At least 2 Flows needed");
              }
            }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-destructive hover:bg-destructive/90"
          >
            <X className="w-4 h-4 text-destructive-foreground" />
          </button>
        )}

        {/* Left side: Logo */}
        <div
          className="rounded-full w-12 h-12 flex justify-center items-center bg-muted"
        >
          {data.image && (
            <img
              src={data.image}
              alt="Logo"
              className="w-8 h-8"
              style={{ display: "block" }}
            />
          )}
        </div>

        {/* Right side: Name of the Zap */}
        <div
          className="text-sm font-medium truncate text-foreground"
        >
          {data.name}
        </div>

        {/* Handles for connecting nodes */}
        {data.action && (
          <Handle
            type="target"
            position={Position.Top}
            className="w-12 bg-primary"
          />
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-12 bg-primary"
        />
      </div>
    </>
  );
});

export default memo(CustomNode);
