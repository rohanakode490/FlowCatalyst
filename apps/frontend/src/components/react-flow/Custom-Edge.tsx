import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { Plus } from "lucide-react";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { resolvedTheme } = useTheme(); // Get current theme
  const isDarkMode = resolvedTheme === "dark";

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const onEdgeClick = (e) => {
    e.stopPropagation();
    data?.onAddNode();
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        className={`stroke-[2px] ${
          isDarkMode ? "stroke-white" : "stroke-black"
        }`}
      />
      <EdgeLabelRenderer>
        <div
          className={`absolute pointer-events-auto origin-center nodrag nopan
          transform translate-x-[-49%] translate-y-[-50%] left-[${labelX}px] top-[${labelY}px]`}
          style={{
            position: "absolute",
            transform: `translate(-49%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <button
            className={`flex items-center justify-center w-8 h-8 border-[3px] cursor-pointer rounded-full 
            ${
              isDarkMode
                ? "bg-[#02081f] text-white border-[#1f2937] hover:bg-[#374151]"
                : "bg-[#f9fafb] text-[#505050] border-[#e5e7eb] hover:bg-[#d1d5db] hover:text-white"
            }`}
            onClick={onEdgeClick}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
