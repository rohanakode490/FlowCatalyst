import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  ConnectionMode,
} from "@xyflow/react";
import CustomNode from "./Custom-Node";
import CustomEdge from "./Custom-Edge";

const nodeTypes = {
  customNode: CustomNode,
};

const edgeTypes = {
  buttonEdge: CustomEdge,
};

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  onNodeClick: (event: any, node: any) => void;
  isDarkMode: boolean;
}

export const FlowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  isDarkMode,
}: FlowCanvasProps) => {
  const reactFlowProps = useMemo(
    () => ({
      nodes,
      edges,
      nodeTypes,
      edgeTypes,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onNodeClick,
      fitView: true,
      maxZoom: 1.5,
      connectionMode: ConnectionMode.Loose,
    }),
    [nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick],
  );

  return (
    <div className="flex-1 relative">
      <ReactFlow {...reactFlowProps}>
        <Background color={isDarkMode ? "#3e1e2f" : "#fff"} gap={16} />
      </ReactFlow>
    </div>
  );
};
