import React from "react";

type Props = { heading: string; children: React.ReactNode };

export default function Heading(props: Props) {
  return (
    <div className="flex flex-col gap-4 relative">
      <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b">
        {props.heading}
      </h1>
      {props.children}{" "}
    </div>
  );
}
