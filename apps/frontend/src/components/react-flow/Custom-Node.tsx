import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";

function CustomNode({ data, id }) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  return (
    <div
      className={`w-48 h-20 rounded-md border-2 shadow-md flex items-center justify-between px-3 ${
        isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-400"
      }`}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onDelete(id);
        }}
        className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
          isDarkMode
            ? "bg-red-600 hover:bg-red-700"
            : "bg-red-500 hover:bg-red-600"
        }`}
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Left side: Logo */}
      <div
        className={`rounded-full w-12 h-12 flex justify-center items-center ${
          isDarkMode ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        <img src={data.logo} alt="Logo" className="w-8 h-8" />
      </div>

      {/* Right side: Name of the Zap */}
      <div
        className={`text-sm font-medium truncate ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        {data.name}
      </div>

      {/* Handles for connecting nodes */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-12 bg-teal-500 ${isDarkMode ? "bg-teal-600" : "bg-teal-400"}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-12 bg-teal-500 ${isDarkMode ? "bg-teal-600" : "bg-teal-400"}`}
      />
    </div>
  );
}

export default memo(CustomNode);
