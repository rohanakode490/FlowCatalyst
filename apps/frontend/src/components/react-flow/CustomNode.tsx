import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTheme } from "next-themes";

function CustomNode({ data }) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  return (
    <div
      className={`px-6 py-4 rounded-md border-2 shadow-md flex items-center ${
        isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-400"
      }`}
    >
      {/* Left side: Logo */}
      <div
        className={`rounded-full w-16 h-16 flex justify-center items-center ${
          isDarkMode ? "bg-gray-700" : "bg-gray-100"
        }`}
      >
        <img src={data.logo} alt="Logo" className="w-10 h-10" />
      </div>

      {/* Right side: Name of the Zap */}
      <div className="ml-4 flex flex-col">
        <div
          className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          {data.name}
        </div>
      </div>

      {/* Handles for connecting nodes */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-16 bg-teal-500 ${isDarkMode ? "bg-teal-600" : "bg-teal-400"}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-16 bg-teal-500 ${isDarkMode ? "bg-teal-600" : "bg-teal-400"}`}
      />
    </div>
  );
}

export default memo(CustomNode);
