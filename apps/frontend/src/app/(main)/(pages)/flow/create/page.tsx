"use client";

import React, { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Heading from "@/components/globals/heading";
import Flow from "@/components/react-flow/Flow";
import useStore, { initialEdges, initialNodes } from "@/lib/store";

export default function FlowCreatePage() {
  const { flow: { setNodes, setEdges, resetFlow }, form: { resetFormData } } = useStore();

  useEffect(() => {
    resetFlow();
    resetFormData();
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [])

  return (
    <Heading heading="Create">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </Heading>
  );
}
