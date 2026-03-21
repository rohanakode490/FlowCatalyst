import { Zap, Workflow, Sparkles, Bot } from "lucide-react";
import Link from "next/link";
import { FooterLinks } from "./footer-links";

const communityLinks = [
  { label: "GitHub", href: "https://github.com/rohanakode490/flowentis" },
  { label: "X", href: "https://x.com/rohanakode7" },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-8">
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-foreground font-bold text-xl">Flowentis</span>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A personal project to help automate your daily workflows and boost
              productivity. Built for developers and creators who want to
              streamline their work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
            <div className="flex items-start gap-3">
              <Workflow className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Easy Automation
                </h3>
                <p className="text-muted-foreground">
                  Connect your favorite tools in minutes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-foreground font-semibold mb-1">No Code</h3>
                <p className="text-muted-foreground">
                  Visual workflow builder for everyone
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-foreground font-semibold mb-1">AI-Powered</h3>
                <p className="text-muted-foreground">
                  Smart suggestions for your workflows
                </p>
              </div>
            </div>
          </div>
          {/* Community Links Section */}
          <div className="md:pl-12">
            <FooterLinks title="Community" links={communityLinks} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            ©2025 Flowentis. Built with ❤️ by Rohan Akode
          </p>
          <div className="flex gap-6 items-center">
            <Link
              href="/privacy-policy"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/refund-policy"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
