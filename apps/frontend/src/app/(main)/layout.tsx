import Sidebar from "@/components/sidebar/sidebar";
import React from "react";
import { Toaster } from "react-hot-toast";

type Props = { children: React.ReactNode };

export default function Layout(props: Props) {
  return (
    <div className="flex overflow-hidden h-screen">
      <Sidebar />
      <div className="w-full">{props.children}</div>
      <Toaster />
    </div>
  );
}
