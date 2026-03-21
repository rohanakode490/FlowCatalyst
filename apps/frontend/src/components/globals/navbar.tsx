"use client";

import Link from "next/link";
import React from "react";
import { links } from "@/lib/constant";
import { MobileNav } from "./mobile-nav-menu";

type Props = {
  OnlyLogo?: boolean;
};

const Navbar = ({ OnlyLogo = false }: Props) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-4 bg-background/40 backdrop-blur-lg border-b border-border">
      {/* Logo Section */}
      <aside className="flex items-center">
        <p className="text-3xl font-bold text-foreground">
          <Link href="/">Flowentis</Link>
        </p>
      </aside>
      {!OnlyLogo && (
        <>
          {/* Desktop Navigation Menu */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6 text-foreground">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-muted-foreground transition-colors">
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
              href="/workflows"
              className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              {/* Animated Background */}
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,var(--primary)_0%,var(--secondary)_50%,var(--primary)_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-background px-3 py-1 text-sm font-medium text-foreground backdrop-blur-3xl">
                Get Started
              </span>
            </Link>

            <MobileNav />
          </aside>
        </>
      )}
    </header>
  );
};

export default Navbar;
