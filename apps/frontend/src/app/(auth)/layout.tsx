import React from "react";
import { Toaster } from "react-hot-toast";

type Props = { children: React.ReactNode };

export default function Layout(props: Props) {
  return (
    <div className="flex overflow-hidden h-screen [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_35%,var(--secondary)_100%)]">
      <div className="w-full">{props.children}</div>
      <Toaster />
    </div>
  );
}
