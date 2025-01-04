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
    <nav className="dark:bg-black h-screen justify-between flex items-center flex-col gap-10 py-6 px-4">
      <div className="flex items-center justify-center flex-col gap-8">
        {/* TODO: Add Logo */}
        <Link className="flex font-bold flex-row py-2" href="/">
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
                        "group h-6 w-8 flex items-center justify-center scale-[1.5] rounded-lg p-[3px] cursor-pointer",
                        {
                          "dark:bg-[#4F006B] bg-[#EEE0FF]":
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
                  className={`bg-black/10 backdrop-blur-xl ${pathName == menuItem.href ? "ml-2" : ""}`}
                >
                  <p>{menuItem.name}</p>
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
