"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Heading from "@/components/globals/heading";
import { ReactFlowProvider } from "@xyflow/react";
import api from "@/lib/api";
import Flow from "@/components/react-flow/Flow";
import useStore from "@/lib/store";

export default function EditZapPage() {
  const params = useParams();
  const zapId = params.zapId as string;
  const router = useRouter();
  const {
    flow: {
      setCurrentTriggerType,
      resetFlow,
      setNodes,
      setEdges,
      setTriggerName,
      setOriginalTriggerMetadata,
    },
    form: { resetFormData },
    ui: { addToast },
  } = useStore();

  const [loading, setLoading] = useState(true);

  // Fetch the saved Zap structure
  useEffect(() => {
    if (!zapId) return;

    const fetchZap = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get(`/zap/${zapId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { trigger, actions } = response.data.zap;

        // Map the trigger and actions to nodes and edges
        const nodes = [
          {
            id: "1",
            type: "customNode",
            position: { x: 0, y: 0 },
            data: {
              id: trigger.type.id, // Set the id from the database
              name: trigger.type.name,
              image: trigger.type.image,
              configured: true,
              action: false, // Trigger node
              metadata: trigger.metadata || {},
            },
          },
          ...actions.map((action: any, index: number) => ({
            id: `${index + 2}`,
            type: "customNode",
            position: { x: 0, y: (index + 1) * 200 },
            data: {
              id: action.type.id, // Set the id from the database
              name: action.type.name,
              image: action.type.image,
              configured: true,
              action: true, // Action node
              metadata: action.metadata || {},
            },
          })),
        ];

        const edges = actions.map((_: any, index: number) => ({
          id: `e${index + 1}-${index + 2}`,
          type: "buttonEdge",
          source: `${index + 1}`,
          target: `${index + 2}`,
        }));

        setCurrentTriggerType(trigger.type.name);
        resetFlow();
        resetFormData();
        setNodes(nodes);
        setEdges(edges);
        setTriggerName(trigger.metadata || {});
        setOriginalTriggerMetadata(trigger.metadata || {});
      } catch (error) {
        console.error("Failed to fetch Zap:", error);
        addToast("Failed to load Zap.", "error");
        router.push("/workflows"); // Redirect to the dashboard if the fetch fails
      } finally {
        setLoading(false);
      }
    };
    if (zapId) {
      fetchZap();
    } else {
      // Initialize default nodes and edges if the zapId does not exists.
      const defaultNodes = [
        {
          id: "1",
          type: "customNode",
          position: { x: 0, y: 0 },
          data: {
            name: "Trigger",
            image: "/logo.png",
            configured: false,
            action: false,
            metadata: {},
            onOpenDialog: () => console.log("Open dialog"),
            canDelete: true,
            onDelete: (id: string) => console.log(`Delete node ${id}`),
            onWebhookSelect: () => console.log("Webhook select"),
            onFormSubmit: () => console.log("Form submit"),
          },
        },
        {
          id: "2",
          type: "customNode",
          position: { x: 0, y: 200 },
          data: {
            name: "Action",
            image: "/logo.png",
            configured: false,
            action: true,
            metadata: {},
            onOpenDialog: () => console.log("Open dialog"),
            canDelete: true,
            onDelete: (id: string) => console.log(`Delete node ${id}`),
            onWebhookSelect: () => console.log("Webhook select"),
            onFormSubmit: () => console.log("Form submit"),
          },
        },
      ];
      const defaultEdges = [
        {
          id: "e1-2",
          type: "buttonEdge",
          source: "1",
          target: "2",
          data: { onAddNode: () => { } }, // Will be set in Flow.tsx
        },
      ];
      setNodes(defaultNodes);
      setEdges(defaultEdges);
    }
  }, [
    zapId,
    router,
    setNodes,
    setEdges,
    setTriggerName,
    setOriginalTriggerMetadata,
  ]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Heading heading="Edit Zap">
      <ReactFlowProvider>
        {!loading && <Flow zapId={zapId} />}
      </ReactFlowProvider>
    </Heading>
  );
}
