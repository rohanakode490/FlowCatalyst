import { Zap, Workflow, Sparkles, Bot } from "lucide-react";
import { FooterLinks } from "./footer-links";

const communityLinks = [
  { label: "GitHub", href: "https://github.com/yourusername/flowcatalyst" },
  { label: "Twitter", href: "https://twitter.com/yourusername" },
  { label: "Discord", href: "/discord" },
];

export function Footer() {
  return (
    <footer className="bg-[#181825] border-t border-neutral-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-8">
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-white" />
              <span className="text-white font-bold text-xl">FlowCatalyst</span>
            </div>
            <p className="text-neutral-400 text-lg leading-relaxed">
              A personal project to help automate your daily workflows and boost
              productivity. Built for developers and creators who want to
              streamline their work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
            <div className="flex items-start gap-3">
              <Workflow className="h-6 w-6 text-neutral-400" />
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Easy Automation
                </h3>
                <p className="text-neutral-400">
                  Connect your favorite tools in minutes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-neutral-400" />
              <div>
                <h3 className="text-white font-semibold mb-1">No Code</h3>
                <p className="text-neutral-400">
                  Visual workflow builder for everyone
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bot className="h-6 w-6 text-neutral-400" />
              <div>
                <h3 className="text-white font-semibold mb-1">AI-Powered</h3>
                <p className="text-neutral-400">
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
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-400 text-sm">
            ©2025 FlowCatalyst. Built with ❤️ by Rohan Akode
          </p>
          <div className="flex gap-6">
            <a
              href="https://github.com/yourusername/flowcatalyst"
              className="text-neutral-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
