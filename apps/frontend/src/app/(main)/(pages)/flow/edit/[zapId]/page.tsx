"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Heading from "@/components/globals/heading";
import { ReactFlowProvider } from "@xyflow/react";
import api from "@/lib/api";
import Flow from "@/components/react-flow/Flow";
import toast from "react-hot-toast";

export default function EditZapPage() {
  const params = useParams();
  const zapId = params.zapId as string;
  const router = useRouter();
  const [initialNodes, setInitialNodes] = useState<any[]>([]);
  const [initialEdges, setInitialEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerData, setTriggerData] = useState<Record<string, any>>({});
  const [originalEventType, setOriginalEventType] = useState<string>("");

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
              logo: trigger.type.image,
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
              logo: action.type.image,
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
        setInitialNodes(nodes);
        setInitialEdges(edges);

        // Fetch trigger data
        const triggerResponse = await api.get(
          `/trigger-response/${trigger.id}`,
        );
        setTriggerData(triggerResponse.data.triggerData);
        if (trigger.metadata?.githubEventType) {
          setOriginalEventType(trigger.metadata.githubEventType);
        }
      } catch (error) {
        console.error("Failed to fetch Zap:", error);
        // router.push("/workflows"); // Redirect to the dashboard if the fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchZap();
  }, [zapId, router]);

  // Function to update triggerData when the trigger type changes
  const updateTriggerData = async (triggerTypeId: string) => {
    try {
      const triggerResponse = await api.get(
        `/trigger-response/${triggerTypeId}`,
      );
      setTriggerData(triggerResponse.data.triggerData);
      setOriginalEventType(triggerTypeId);
    } catch (error) {
      console.error("Failed to fetch trigger data:", error);
      setTriggerData({});
      toast.error("Failed to fetch trigger data. Using default values.");
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading state
  }

  return (
    <Heading heading="Edit Zap">
      <ReactFlowProvider>
        {!loading && (
          <Flow
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            triggerData={triggerData}
            zapId={zapId}
            onTriggerTypeChange={updateTriggerData}
            originalEventType={originalEventType}
          />
        )}
      </ReactFlowProvider>
    </Heading>
  );
}
