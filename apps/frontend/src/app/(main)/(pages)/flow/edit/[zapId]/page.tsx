"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Heading from "@/components/globals/heading";
import { ReactFlowProvider } from "@xyflow/react";
import api from "@/lib/api";
import Flow from "@/components/react-flow/Flow";

export default function EditZapPage() {
  const params = useParams();
  const zapId = params.zapId as string;
  const router = useRouter();
  const [initialNodes, setInitialNodes] = useState<any[]>([]);
  const [initialEdges, setInitialEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggerData, setTriggerData] = useState<Record<string, any>>({});
  const [originalEventType, setOriginalEventType] = useState<any[]>([]);

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
        setInitialNodes(nodes);
        setInitialEdges(edges);

        setTriggerData(trigger.metadata);
        setOriginalEventType(nodes);
      } catch (error) {
        console.error("Failed to fetch Zap:", error);
        router.push("/workflows"); // Redirect to the dashboard if the fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchZap();
  }, [zapId, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Heading heading="Edit Zap">
      <ReactFlowProvider>
        {!loading && (
          <Flow
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            triggerData={triggerData}
            setTriggerData={setTriggerData}
            zapId={zapId}
            originalEventType={originalEventType}
          />
        )}
      </ReactFlowProvider>
    </Heading>
  );
}
