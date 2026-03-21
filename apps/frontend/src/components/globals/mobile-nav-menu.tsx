"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { links } from "@/lib/constant";

export const MobileNav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div>
      {/* Mobile Navigation Menu Toggle */}
      <aside className="flex items-center gap-4 md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          className="text-foreground focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </aside>
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <nav className="absolute top-16 left-0 right-0 bg-background/40 backdrop-blur-lg border-border md:hidden">
          <ul className="flex flex-col items-start p-4 space-y-4 text-foreground bg-background/40 backdrop-blur-3xl">
            {links.map((link) => (
              <li key={link.href} className="w-full">
                <Link
                  href={link.href}
                  className="block w-full text-left px-2 py-2 hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};
