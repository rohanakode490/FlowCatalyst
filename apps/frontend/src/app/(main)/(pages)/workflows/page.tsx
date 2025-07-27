"use client";

import React, { useEffect, Suspense } from "react";
import Heading from "@/components/globals/heading";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import GetZaps from "@/components/Zap/get-zaps";
import ZapTable from "@/components/Zap/zap-table";
import { useRouter, useSearchParams } from "next/navigation";
import useStore from "@/lib/store";

// Move the searchParams logic into a separate component
function WorkflowsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: { setAccessToken } } = useStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const access_token = searchParams.get("access_token")
    if (access_token && typeof access_token === "string") {
      setAccessToken(access_token);
    }
    if (token) {
      localStorage.setItem("token", token);
      router.replace("/workflows");
    }
  }, [searchParams, router]);

  const { loading, zaps } = GetZaps();

  return (
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
  );
}

export default function WorkflowsPage() {
  return (
    <Heading heading="Workflows">
      <Suspense fallback={<div>Loading...</div>}>
        <WorkflowsContent />
      </Suspense>
    </Heading>
  );
}
