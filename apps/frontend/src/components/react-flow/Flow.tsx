"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import useWebhook from "@/hooks/Webhook";
import { FlowControls } from "./Flow-Controls";
import { NodeConfigDialog } from "./Node-Config-Dialog";
import { Sidebar } from "./Zap-Info-Sidebar";
import { FlowCanvas } from "./Flow-Canvas";
import { addNodeBelow, alignNodesVertically, deleteNode } from "./Flow-Helpers";
import { useTheme } from "next-themes";
import "@xyflow/react/dist/style.css";
import { ChatInterface } from "../chat-interface/AI-ChatInterface";
import { X } from "lucide-react";
import userWebhook from "@/hooks/User";
import useStore from "@/lib/store";
import { useShallow } from "zustand/shallow";

export const VERTICAL_SPACING = 200;

interface FlowProps {
  zapId?: string;
}

export default function Flow({ zapId }: FlowProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const { fitView } = useReactFlow();
  const {
    flow: {
      nodes,
      edges,
      selectedNodeId,
      onNodesChange,
      onEdgesChange,
      onConnect,
      setNodes,
      setEdges,
      setTriggerName,
      addNode,
      updateNodeData,
      setSelectedNodeId,
    },
    ui: { addToast },
  } = useStore(
    useShallow((state) => ({
      flow: state.flow,
      ui: state.ui,
    })),
  );

  const [showChat, setShowChat] = useState(false);

  const { isDialogOpen, handleWebhookSelect, openDialog, closeDialog } =
    useWebhook();

  const { userSubscription } = userWebhook();

  // Hydration fix
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id); // Always set the selected node ID
      if (node.data !== undefined && !node.data.configured) {
        openDialog(); // Open the dialog for unconfigured nodes
      }
    },
    [openDialog, setSelectedNodeId],
  );

  // Handle webhook selection
  const handleWebhookSelectForNode = useCallback(
    (nodeId: string, webhook: any) => {
      updateNodeData(nodeId, {
        id: webhook.id,
        name: webhook.name,
        image: webhook.image,
        configured: true,
        metadata: webhook.metadata || {},
      });
      if (!webhook.action) {
        setTriggerName(webhook.metadata || {});
      }
      handleWebhookSelect(webhook);
    },
    [updateNodeData, setTriggerName, handleWebhookSelect],
  );

  // Handle form submission
  const handleFormSubmit = useCallback(
    (nodeId: string, formData: Record<string, any>) => {
      updateNodeData(nodeId, { metadata: formData });
      if (!nodes.find((node) => node.id === nodeId)?.data.action) {
        setTriggerName(formData);
      }
      addToast("Configuration saved!", "success");
    },
    [updateNodeData, setTriggerName, addToast, nodes],
  );

  // Handle changing the webhook
  const handleOpenDialog = useCallback(() => {
    openDialog(); // Open the dialog for webhook selection
  }, [openDialog]);

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    closeDialog(); // Close the dialog
  }, [closeDialog]);

  // Get the selected node's data
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  useEffect(() => {
    if (
      selectedNode !== undefined &&
      selectedNode.data.action === false &&
      selectedNode.data.configured === true &&
      selectedNode.data.metadata !== undefined
    ) {
      setTriggerName(selectedNode.data.metadata);
    }
  }, [selectedNode, setTriggerName]);

  useEffect(() => {
    const savedChatVisibility = localStorage.getItem("showChat");
    setShowChat(savedChatVisibility === "true");
  }, []);

  const toggleChat = () => {
    const newVisibility = !showChat;
    setShowChat(newVisibility);
    localStorage.setItem("showChat", newVisibility.toString());
  };

  // Memoized nodes with handlers
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((node: any) => ({
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
    return edges.map((edge: any) => ({
      ...edge,
      data: {
        ...edge.data,
        onAddNode: () => addNode(edge.source),
      },
    }));
  }, [edges, nodes, setNodes, setEdges]);

  const handleWorkflowGenerated = (newNodes: any, newEdges: any) => {
    setNodes(newNodes);
    setEdges(newEdges);
  };

  if (!mounted) return null; // Prevent rendering during SSR

  return (
    <div className="flex flex-col h-full">
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

        {/* Chat Interface */}
        {showChat && (
          <div className="absolute top-48 left-8 w-96 bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] rounded-md shadow-lg">
            <div className="flex justify-between items-center p-3 border-b border-[#e5e7eb] dark:border-[#374151]">
              <h3 className="font-medium text-[#111827] dark:text-gray-100">
                AI Workflow Assistant
              </h3>
              <button
                onClick={toggleChat}
                className="p-1 rounded-full hover:bg-[#f9fafb] dark:hover:bg-[#374151] transition-colors"
              >
                <X className="w-4 h-4 text-[#6b7280] dark:text-gray-300" />
              </button>
            </div>
            <div className="p-4">
              <ChatInterface onWorkflowGenerated={handleWorkflowGenerated} />
            </div>
          </div>
        )}

        {/* Chat Toggle Button */}
        {!showChat && (
          <button
            onClick={toggleChat}
            className="absolute top-48 left-7 p-2 bg-white dark:bg-[#1f2937] border border-[#e5e7eb] dark:border-[#374151] rounded-md shadow-sm hover:bg-[#f9fafb] dark:hover:bg-[#374151] transition-colors"
          >
            <span className="text-sm text-[#111827] dark:text-gray-100">
              Open AI Assistant
            </span>
          </button>
        )}

        {/* Floating Toolbar (Bottom-Right Corner) */}
        <div className="absolute bottom-20 left-4 flex gap-2">
          <FlowControls
            onAlignNodes={() =>
              alignNodesVertically(setNodes, fitView, VERTICAL_SPACING)
            }
            zapId={zapId}
          />
        </div>
        {/* Conditionally Render Sidebar Panel */}
        {selectedNode && !isDialogOpen && (
          <Sidebar
            selectedNode={selectedNode}
            onClose={() => setSelectedNodeId("")}
            openDialog={() => handleOpenDialog()}
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
    </div>
  );
}
