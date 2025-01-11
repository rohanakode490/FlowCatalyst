"use client";

import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import Heading from "@/components/globals/heading";
import Flow from "@/components/react-flow/Flow";

export default function FlowCreatePage() {
  return (
    <Heading heading="Create">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </Heading>
  );
}
