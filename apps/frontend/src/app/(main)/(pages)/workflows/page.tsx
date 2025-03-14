"use client";

import React, { useEffect } from "react";
import Heading from "@/components/globals/heading";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import GetZaps from "@/components/Zap/get-zaps";
import ZapTable from "@/components/Zap/zap-table";
import { useRouter, useSearchParams } from "next/navigation";

export default function WorkflowsPage() {
  const { loading, zaps } = GetZaps();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      router.replace("/workflows");
    }
  }, [searchParams, router]);

  return (
    <Heading heading="Workflows">
      <div className="flex flex-col gap-6">
        <Button
          className="self-start hover:bg-[#2F006B] hover:text-white ml-3 px-5 font-semibold gap-1"
          onClick={() => {
            router.push("/flow/create");
          }}
        >
          <CirclePlus />
          Create
        </Button>
        <div className="px-2">
          {/* TODO: Create a loading component */}
          {loading ? "loading" : <ZapTable zaps={zaps} />}
        </div>
      </div>
    </Heading>
  );
}
