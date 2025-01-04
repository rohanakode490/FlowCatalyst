"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import CustomNode from "@/components/react-flow/CustomNode";
import Heading from "@/components/globals/heading";

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  {
    id: "1",
    type: "custom",
    position: { x: 0, y: 200 },
    data: { name: "LinkedIn", logo: "/logo.png" },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 0, y: 600 },
    data: { name: "Email", emoji: "/logo.png" },
  },
];

const initialEdges = [{ id: "e2-2", source: "1", target: "2" }];

export default function FlowCreatePage() {
  const { resolvedTheme } = useTheme();

  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = resolvedTheme === "dark";

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  if (!mounted) return null; // Prevent rendering during SSR

  return (
    <Heading heading="Create">
      <div className="w-[101vw] h-[80vh]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background color={isDarkMode ? "#2e1e2f" : "#fff"} gap={16} />
        </ReactFlow>
      </div>
    </Heading>
  );
}
