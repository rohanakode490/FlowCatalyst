"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import CustomNode from "@/components/react-flow/Custom-Node";
import Heading from "@/components/globals/heading";
import CustomEdge from "@/components/react-flow/Custom-Edge";
import { Button } from "@/components/ui/button";

const nodeTypes = {
  customNode: CustomNode,
};

const edgeTypes = {
  buttonEdge: CustomEdge,
};

const VERTICAL_SPACING = 200;

const initialNodes = [
  {
    id: "1",
    type: "customNode",
    position: { x: 0, y: 0 },
    data: { name: "LinkedIn", logo: "/logo.png" },
  },
  {
    id: "2",
    type: "customNode",
    position: { x: 0, y: 300 },
    data: { name: "Email", emoji: "/logo.png" },
  },
];

const initialEdges = [
  { id: "e2-2", type: "buttonEdge", source: "1", target: "2" },
];

function Flow() {
  const { resolvedTheme } = useTheme();

  const isDarkMode = resolvedTheme === "dark";

  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Align nodes vertically
  const alignNodesVertically = useCallback(() => {
    setNodes((nds) => {
      const sortedNodes = [...nds].sort((a, b) => a.position.y - b.position.y);
      return sortedNodes.map((node, index) => ({
        ...node,
        position: {
          x: 0,
          y: index * VERTICAL_SPACING,
        },
      }));
    });
    setTimeout(() => fitView({ padding: 0.1, duration: 200 }), 50);
  }, [setNodes, fitView]);

  // Add node between two nodes
  const addNodeBelow = useCallback(
    (sourceNodeId) => {
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      if (!sourceNode) return;

      // Find if there's a node below the source node
      const targetEdge = edges.find((e) => e.source === sourceNodeId);
      const targetNode = targetEdge
        ? nodes.find((n) => n.id === targetEdge.target)
        : null;

      const newNodeId = `${Date.now()}`;
      const newY = sourceNode.position.y + VERTICAL_SPACING;

      // Add new node
      const newNode = {
        id: newNodeId,
        type: "customNode",
        position: { x: 0, y: newY },
        data: { name: "New Node", logo: "/logo.png" },
      };

      // If there was a target node, update its position and edges
      if (targetNode) {
        setNodes((nds) => {
          return nds.map((node) => {
            if (node.id === targetNode.id) {
              return {
                ...node,
                position: {
                  ...node.position,
                  y: newY + VERTICAL_SPACING,
                },
              };
            }
            return node;
          });
        });

        setEdges((eds) => [
          ...eds.filter((e) => e.source !== sourceNodeId),
          {
            id: `e${sourceNodeId}-${newNodeId}`,
            type: "buttonEdge",
            source: sourceNodeId,
            target: newNodeId,
          },
          {
            id: `e${newNodeId}-${targetNode.id}`,
            type: "buttonEdge",
            source: newNodeId,
            target: targetNode.id,
          },
        ]);
      } else {
        // If no target node, just add new node and edge
        setEdges((eds) => [
          ...eds,
          {
            id: `e${sourceNodeId}-${newNodeId}`,
            type: "buttonEdge",
            source: sourceNodeId,
            target: newNodeId,
          },
        ]);
      }

      setNodes((nds) => [...nds, newNode]);
      alignNodesVertically();
    },
    [nodes, edges, setNodes, setEdges, alignNodesVertically],
  );

  // Delete node and connect adjacent nodes
  const deleteNode = useCallback(
    (nodeId) => {
      // Find edges connected to this node
      const nodeEdges = edges.filter(
        (e) => e.source === nodeId || e.target === nodeId,
      );
      const sourceEdge = nodeEdges.find((e) => e.target === nodeId);
      const targetEdge = nodeEdges.find((e) => e.source === nodeId);

      // Remove the node
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));

      // If node had connections on both sides, connect them
      if (sourceEdge && targetEdge) {
        setEdges((eds) => [
          ...eds.filter((e) => !nodeEdges.includes(e)),
          {
            id: `e${sourceEdge.source}-${targetEdge.target}`,
            type: "buttonEdge",
            source: sourceEdge.source,
            target: targetEdge.target,
          },
        ]);
      } else {
        setEdges((eds) => eds.filter((e) => !nodeEdges.includes(e)));
      }

      alignNodesVertically();
    },
    [edges, setNodes, setEdges, alignNodesVertically],
  );

  const onConnect = useCallback(
    (connection) => {
      const edge = { ...connection, type: "buttonEdge" };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  // Memoized nodes with handlers
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: () => deleteNode(node.id),
      },
    }));
  }, [nodes, deleteNode]);

  // Memoized edges with handlers
  const edgesWithHandlers = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        onAddNode: () => addNodeBelow(edge.source),
      },
    }));
  }, [edges, addNodeBelow]);

  // Memoized ReactFlow props
  const reactFlowProps = useMemo(
    () => ({
      nodes: nodesWithHandlers,
      edges: edgesWithHandlers,
      nodeTypes,
      edgeTypes,
      onNodesChange,
      onEdgesChange,
      onConnect,
      fitView: true,
      maxZoom: 1.5,
      connectionMode: ConnectionMode.Loose,
    }),
    [
      nodesWithHandlers,
      edgesWithHandlers,
      onNodesChange,
      onEdgesChange,
      onConnect,
    ],
  );

  if (!mounted) return null; // Prevent rendering during SSR

  return (
    <>
      <Button
        onClick={alignNodesVertically}
        className="self-start hover:bg-[#3F006B] hover:text-white"
      >
        Align Nodes
      </Button>

      <div className="w-[90vw] h-[90vh] overflow-auto">
        <ReactFlow {...reactFlowProps}>
          <Background color={isDarkMode ? "#3e1e2f" : "#fff"} gap={16} />
        </ReactFlow>
      </div>
    </>
  );
}

export default function FlowCreatePage() {
  return (
    <Heading heading="Create">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </Heading>
  );
}
