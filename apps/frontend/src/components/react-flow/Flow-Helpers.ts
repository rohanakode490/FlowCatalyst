import { Node, Edge, useNodesState, useEdgesState } from "@xyflow/react";

// Define types for the helper functions
type NodeType = Node<{
  name: string;
  logo: string;
  configured: boolean;
  action: boolean;
  formData?: Record<string, any>;
}>;

type EdgeType = Edge;

type SetNodesType = ReturnType<typeof useNodesState>[1];
type SetEdgesType = ReturnType<typeof useEdgesState>[1];
type FitViewType = (options?: { padding?: number; duration?: number }) => void;

/**
 * Align nodes vertically with equal spacing.
 */
export const alignNodesVertically = (
  setNodes: SetNodesType,
  fitView: FitViewType,
  VERTICAL_SPACING: number,
) => {
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
};

/**
 * Add a new node below the source node.
 */
export const addNodeBelow = (
  sourceNodeId: string,
  nodes: NodeType[],
  edges: EdgeType[],
  setNodes: SetNodesType,
  setEdges: SetEdgesType,
  VERTICAL_SPACING: number,
  alignNodesVertically: (
    setNodes: SetNodesType,
    fitView: FitViewType,
    VERTICAL_SPACING: number,
  ) => void,
) => {
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  if (!sourceNode) return;

  const targetEdge = edges.find((e) => e.source === sourceNodeId);
  const targetNode = targetEdge
    ? nodes.find((n) => n.id === targetEdge.target)
    : null;

  const newNodeId = `${Date.now()}`;
  const newY = sourceNode.position.y + VERTICAL_SPACING;

  const newNode: NodeType = {
    id: newNodeId,
    type: "customNode",
    position: { x: 1, y: newY },
    data: {
      name: "New Node",
      logo: "/logo.png",
      configured: false,
      action: true,
    },
  };

  if (targetNode) {
    setNodes((nds) =>
      nds.map((node) => {
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
      }),
    );

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
  alignNodesVertically(setNodes, () => {}, VERTICAL_SPACING); // Mock fitView for now
};

/**
 * Delete a node and connect adjacent nodes.
 */
export const deleteNode = (
  nodeId: string,
  nodes: NodeType[],
  edges: EdgeType[],
  setNodes: SetNodesType,
  setEdges: SetEdgesType,
  VERTICAL_SPACING: number,
  alignNodesVertically: (
    setNodes: SetNodesType,
    fitView: FitViewType,
    VERTICAL_SPACING: number,
  ) => void,
) => {
  if (nodes.length <= 3) return;

  const nodeEdges = edges.filter(
    (e) => e.source === nodeId || e.target === nodeId,
  );
  const sourceEdge = nodeEdges.find((e) => e.target === nodeId);
  const targetEdge = nodeEdges.find((e) => e.source === nodeId);

  setNodes((nds) => nds.filter((n) => n.id !== nodeId));

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

  alignNodesVertically(setNodes, () => {}, VERTICAL_SPACING);
};
