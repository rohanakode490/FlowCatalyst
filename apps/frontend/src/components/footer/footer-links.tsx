"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface FooterLinksProps {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
  className?: string;
}

export function FooterLinks({ title, links, className }: FooterLinksProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h3 className="text-neutral-300 font-semibold mb-3">{title}</h3>
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
