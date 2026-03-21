"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { menuOptions } from "@/lib/constant";
import clsx from "clsx";
import { ModeToggle } from "@/components/globals/mode-toggle";

export default function Sidebar() {
  const pathName = usePathname();

  return (
    <nav className="bg-background h-screen justify-between flex items-center flex-col gap-10 py-6 px-4 border-r border-border">
      <div className="flex items-center justify-center flex-col gap-8">
        <Link className="flex font-bold flex-row py-2 text-foreground" href="/">
          Flow
        </Link>

        {/* Navigation  */}
        <TooltipProvider>
          {menuOptions.map((menuItem) => (
            <ul key={menuItem.name}>
              <Tooltip delayDuration={2}>
                <TooltipTrigger>
                  <li>
                    <Link
                      href={menuItem.href}
                      className={clsx(
                        "group h-6 w-8 flex items-center justify-center scale-[1.5] rounded-lg p-[3px] cursor-pointer transition-all",
                        {
                          "bg-primary shadow-lg shadow-primary/30":
                            pathName === menuItem.href,
                        },
                      )}
                    >
                      <menuItem.Component
                        selected={pathName === menuItem.href}
                      />
                    </Link>
                  </li>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className={`bg-background/80 backdrop-blur-xl border-border ${pathName == menuItem.href ? "ml-2" : ""}`}
                >
                  <p className="text-foreground">{menuItem.name}</p>
                </TooltipContent>
              </Tooltip>
            </ul>
          ))}
        </TooltipProvider>
      </div>
      <div className="flex items-center justify-center flex-col gap-8">
        <ModeToggle />
      </div>
    </nav>
  );
}
