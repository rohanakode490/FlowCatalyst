"use client";

import Link from "next/link";
import React from "react";
import { links } from "@/lib/constant";
import { MobileNav } from "./mobile-nav-menu";

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-4 bg-black/40 backdrop-blur-lg border-b border-neutral-900">
      {/* Logo Section */}
      <aside className="flex items-center">
        <p className="text-3xl font-bold text-white">FlowCatalyst</p>
      </aside>

      {/* Desktop Navigation Menu */}
      <nav className="hidden md:block">
        <ul className="flex items-center gap-6 text-white">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-neutral-400">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Right Section */}
      <aside className="flex items-center gap-4">
        {/* Get Started Button */}
        <Link
          href="/signup"
          className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          {/* Animated Background */}
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            Get Started
          </span>
        </Link>

        <MobileNav />
      </aside>
    </header>
  );
};

export default Navbar;
