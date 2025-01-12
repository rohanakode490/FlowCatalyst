"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "@xyflow/react";
import useWebhook from "@/hooks/Webhook";
import { FlowControls } from "./Flow-Controls";
import { NodeConfigDialog } from "./Node-Config-Dialog";
import { Sidebar } from "./Zap-Info-Sidebar";
import { FlowCanvas } from "./Flow-Canvas";
import { addNodeBelow, alignNodesVertically, deleteNode } from "./Flow-Helpers";
import { useTheme } from "next-themes";
import "@xyflow/react/dist/style.css";

const VERTICAL_SPACING = 200;

const initialNodes = [
  {
    id: "1",
    type: "customNode",
    position: { x: 0, y: 0 },
    data: {
      name: "LinkedIn",
      logo: "/logo.png",
      configured: false,
      action: false,
    },
  },
  {
    id: "2",
    type: "customNode",
    position: { x: 0, y: 300 },
    data: {
      name: "Email",
      logo: "/logo.png",
      configured: false,
      action: true,
    },
  },
];

const initialEdges = [
  { id: "e2-2", type: "buttonEdge", source: "1", target: "2" },
];

interface FlowProps {
  initialNodes?: any[]; // Optional initial nodes
  initialEdges?: any[]; // Optional initial edges
}

export default function Flow({
  initialNodes: propNodes,
  initialEdges: propEdges,
}: FlowProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    propNodes || initialNodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    propEdges || initialEdges,
  );

  const [selectedNodeId, setSelectedNodeId] = useState(""); // Track selected node
  const {
    selectedWebhook,
    isDialogOpen,
    handleWebhookSelect,
    openDialog,
    closeDialog,
  } = useWebhook();

  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const onConnect = useCallback(
    (connection: any) => {
      // Check if the source node already has an outgoing edge
      const hasOutgoingEdge = edges.some(
        (edge) => edge.source === connection.source,
      );
      // Check if the target node already has an incoming edge
      const hasIncomingEdge = edges.some(
        (edge) => edge.target === connection.target,
      );

      if (hasOutgoingEdge) {
        alert("Source node already has an outgoing edge!");
        return;
      }

      if (hasIncomingEdge) {
        alert("Target node already has an incoming edge!");
        return;
      }

      // If checks pass, add the new edge
      const edge = { ...connection, type: "buttonEdge" };
      setEdges((eds) => addEdge(edge, eds));
    },
    [edges, setEdges],
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (event, node) => {
      setSelectedNodeId(node.id); // Always set the selected node ID
      if (!node.data.configured) {
        openDialog(); // Open the dialog for unconfigured nodes
      }
    },
    [openDialog],
  );

  // Handle webhook selection
  const handleWebhookSelectForNode = useCallback(
    (nodeId, webhook) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                id: webhook.id, // Set the id from the selected webhook
                name: webhook.name, // Update name
                logo: webhook.logo, // Update logo
                configured: true, // Mark as configured
                metadata: webhook.defaultFormData || {}, // Reset form data for the new webhook
              },
            };
          }
          return node;
        }),
      );
      handleWebhookSelect(webhook); // Update selected webhook
    },
    [setNodes, handleWebhookSelect],
  );

  // Handle form submission
  const handleFormSubmit = useCallback(
    (nodeId: string, formData: Record<string, any>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                metadata: formData,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  // Handle changing the webhook
  const handleChangeWebhook = useCallback(
    (nodeId) => {
      openDialog(); // Open the dialog for webhook selection
    },
    [openDialog],
  );

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    closeDialog(); // Close the dialog
  }, [closeDialog]);

  // Get the selected node's data
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  // Memoized nodes with handlers
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: () =>
          deleteNode(
            node.id,
            nodes,
            edges,
            setNodes,
            setEdges,
            VERTICAL_SPACING,
            () => alignNodesVertically(setNodes, fitView, VERTICAL_SPACING),
          ),
        canDelete: nodes.length > 2,
        onWebhookSelect: handleWebhookSelectForNode,
        onFormSubmit: handleFormSubmit,
        onOpenDialog: openDialog,
      },
    }));
  }, [
    nodes,
    edges,
    setNodes,
    setEdges,
    handleWebhookSelectForNode,
    handleFormSubmit,
    openDialog,
  ]);

  // Memoized edges with handlers
  const edgesWithHandlers = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        onAddNode: () =>
          addNodeBelow(
            edge.source,
            nodes,
            edges,
            setNodes,
            setEdges,
            VERTICAL_SPACING,
            () => alignNodesVertically(setNodes, fitView, VERTICAL_SPACING),
          ),
      },
    }));
  }, [edges, nodes, setNodes, setEdges]);

  if (!mounted) return null; // Prevent rendering during SSR

  return (
    <>
      {/* <FlowControls */}
      {/*   onAlignNodes={() => */}
      {/*     alignNodesVertically(setNodes, fitView, VERTICAL_SPACING) */}
      {/*   } */}
      {/*   nodes={nodes} */}
      {/*   edges={edges} */}
      {/* /> */}

      <div className="flex w-[90vw] h-[90vh] overflow-hidden">
        <FlowCanvas
          nodes={nodesWithHandlers}
          edges={edgesWithHandlers}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          isDarkMode={isDarkMode}
        />

        {/* Floating Toolbar (Bottom-Right Corner) */}
        <div className="absolute bottom-20 left-4 flex gap-2">
          <FlowControls
            onAlignNodes={() =>
              alignNodesVertically(setNodes, fitView, VERTICAL_SPACING)
            }
            nodes={nodes}
            edges={edges}
          />
        </div>
        {/* Conditionally Render Sidebar Panel */}
        {selectedNode && !isDialogOpen && (
          <Sidebar
            selectedNode={selectedNode}
            selectedNodeId={selectedNodeId}
            onClose={() => setSelectedNodeId(null)}
            onChangeWebhook={() => handleChangeWebhook(selectedNodeId)}
            onFormSubmit={handleFormSubmit}
          />
        )}
      </div>
      <NodeConfigDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSelectWebhook={(webhook) =>
          handleWebhookSelectForNode(selectedNodeId, webhook)
        }
        isAction={selectedNode?.data.action}
      />
    </>
  );
}
