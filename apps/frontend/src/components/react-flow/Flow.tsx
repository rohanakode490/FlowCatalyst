"use client";

import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { ChatInterface } from "../chat-interface/AI-ChatInterface";
import { X } from "lucide-react";

const VERTICAL_SPACING = 200;

const initialNodes = [
  {
    id: "1",
    type: "customNode",
    position: { x: 0, y: 0 },
    data: {
      name: "Trigger",
      image:
        "https://res.cloudinary.com/dmextegpu/image/upload/v1738394735/webhook_cpzcgw.png",
      configured: false,
      action: false,
      onOpenDialog: () => console.log("Open dialog"),
      canDelete: true,
      onDelete: (id: string) => console.log(`Delete node ${id}`),
    },
  },
  {
    id: "2",
    type: "customNode",
    position: { x: 0, y: 300 },
    data: {
      name: "Action",
      image:
        "https://res.cloudinary.com/dmextegpu/image/upload/v1738418144/icons8-process-500_mi2vrh.png",
      configured: false,
      action: true,
      onOpenDialog: () => console.log("Open dialog"),
      canDelete: true,
      onDelete: (id: string) => console.log(`Delete node ${id}`),
    },
  },
];

const initialEdges = [
  {
    id: "e2-2",
    type: "buttonEdge",
    source: "1",
    target: "2",
    data: { onAddNode: () => console.log("AddNode") },
  },
];

interface FlowProps {
  initialNodes?: any[];
  initialEdges?: any[];
  triggerData?: Record<string, any> | undefined;
  setTriggerData?: Dispatch<SetStateAction<Record<string, any>>>;
  zapId?: string;
  originalEventType?: any[];
}

export default function Flow({
  initialNodes: propNodes,
  initialEdges: propEdges,
  triggerData,
  setTriggerData,
  zapId,
  originalEventType,
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
  const [triggerName, setTriggerName] = useState<Record<string, any>>({});
  const [showChat, setShowChat] = useState(false);

  const {
    webhooks,
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
    (_: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id); // Always set the selected node ID
      if (node.data !== undefined && !node.data.configured) {
        openDialog(); // Open the dialog for unconfigured nodes
      }
    },
    [openDialog],
  );

  // Handle webhook selection
  const handleWebhookSelectForNode = useCallback(
    (nodeId: any, webhook: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                id: webhook.id,
                name: webhook.name,
                image: webhook.image,
                configured: true,
                metadata: webhook.metadata || {},
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
      selectedNode.data.configured === true
    ) {
      setTriggerName(selectedNode.data.metadata);
    }
  }, [selectedNode, triggerName]);

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

  // Handle trigger type changes
  const handleTriggerTypeChange = (triggerTypeId: string) => {
    if (originalEventType !== undefined) {
      if (
        triggerTypeId !== originalEventType[0].data.metadata?.githubEventType
      ) {
        return;
      }
      if (setTriggerData !== undefined) {
        setTriggerData(originalEventType[0].data.metadata.githubEventType);
        setNodes(originalEventType);
      }
    }
  };

  const handleWorkflowGenerated = (newNodes: any, newEdges: any) => {
    setNodes(newNodes);
    setEdges(newEdges);
  };

  if (!mounted) return null; // Prevent rendering during SSR

  return (
    <div className="flex flex-col h-full">
      {/* <FlowControls */}
      {/*   onAlignNodes={() => */}
      {/*     alignNodesVertically(setNodes, fitView, VERTICAL_SPACING) */}
      {/*   } */}
      {/*   nodes={nodes} */}
      {/*   edges={edges} */}
      {/* /> */}
      {/* <div className="mb-4 mx-"> */}
      {/* <ChatInterface onWorkflowGenerated={handleWorkflowGenerated} /> */}
      {/* </div> */}
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
            nodes={nodes}
            edges={edges}
            zapId={zapId}
          />
        </div>
        {/* Conditionally Render Sidebar Panel */}
        {selectedNode && !isDialogOpen && (
          <Sidebar
            selectedNode={selectedNode}
            selectedNodeId={selectedNodeId}
            triggerName={triggerName}
            setTriggerName={setTriggerName}
            onClose={() => setSelectedNodeId("")}
            openDialog={() => handleOpenDialog()}
            onFormSubmit={handleFormSubmit}
            triggerData={triggerData}
            handleTriggerTypeChange={handleTriggerTypeChange}
          />
        )}
      </div>
      <NodeConfigDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        setTriggerName={setTriggerName}
        onSelectWebhook={(webhook) =>
          handleWebhookSelectForNode(selectedNodeId, webhook)
        }
        isAction={selectedNode?.data.action}
        handleTriggerTypeChange={handleTriggerTypeChange}
      />
    </div>
  );
}
