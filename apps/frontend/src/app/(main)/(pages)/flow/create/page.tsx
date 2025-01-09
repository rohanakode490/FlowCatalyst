"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import Heading from "@/components/globals/heading";

import useWebhook from "@/hooks/Webhook";
import { FlowControls } from "@/components/react-flow/Flow-Controls";
import { NodeConfigDialog } from "@/components/react-flow/Node-Config-Dialog";
import { Sidebar } from "@/components/react-flow/Zap-Info-Sidebar";
import { FlowCanvas } from "@/components/react-flow/Flow-Canvas";
import {
  addNodeBelow,
  alignNodesVertically,
  deleteNode,
} from "@/components/react-flow/Flow-Helpers";

const VERTICAL_SPACING = 200;

const initialNodes = [
  {
    id: "1",
    type: "customNode",
    position: { x: 0, y: 0 },
    data: { name: "LinkedIn", logo: "/logo.png", configured: false },
  },
  {
    id: "2",
    type: "customNode",
    position: { x: 0, y: 300 },
    data: { name: "Email", logo: "/logo.png", configured: false },
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
  const [selectedNodeId, setSelectedNodeId] = useState(null); // Track selected node
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
    (connection) => {
      const edge = { ...connection, type: "buttonEdge" };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
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
                name: webhook.name, // Update name
                logo: webhook.logo, // Update logo
                configured: true, // Mark as configured
                formData: webhook.defaultFormData || {}, // Reset form data for the new webhook
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
    (nodeId, formData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                formData,
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
    deleteNode,
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
  }, [edges, addNodeBelow]);

  if (!mounted) return null; // Prevent rendering during SSR

  return (
    <>
      <FlowControls
        onAlignNodes={() =>
          alignNodesVertically(setNodes, fitView, VERTICAL_SPACING)
        }
      />

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
      />
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
