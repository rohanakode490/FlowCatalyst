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

  // Fetch the saved Zap structure
  useEffect(() => {
    if (!zapId) return;

    const fetchZap = async () => {
      try {
        const response = await api.get(`/zap/${zapId}`, {
          headers: {
            Authorization: localStorage.getItem("token"),
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
              metadata: trigger.triggerMetadata || {},
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
              metadata: action.actionMetadata || {},
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
      } catch (error) {
        console.error("Failed to fetch Zap:", error);
        // router.push("/workflows"); // Redirect to the dashboard if the fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchZap();
  }, [zapId, router]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading state
  }

  // TODO: Add a PUT method for the save button

  return (
    <Heading heading="Edit Zap">
      <ReactFlowProvider>
        {!loading && (
          <Flow initialNodes={initialNodes} initialEdges={initialEdges} />
        )}
      </ReactFlowProvider>
    </Heading>
  );
}