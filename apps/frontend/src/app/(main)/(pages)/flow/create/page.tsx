"use client";

import React, { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Heading from "@/components/globals/heading";
import Flow from "@/components/react-flow/Flow";
import useStore from "@/lib/store";

export default function FlowCreatePage() {
  const { form: { setFormData } } = useStore();

  useEffect(() => {
    setFormData([])
  }, [])

  return (
    <Heading heading="Create">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </Heading>
  );
}
