"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/globals/navbar";
import { Footer } from "@/components/footer/footer";
import Link from "next/link";
import { 
  BookOpen, 
  Zap, 
  Settings, 
  ShieldCheck, 
  HelpCircle, 
  Github, 
  Mail, 
  Table as TableIcon, 
  Coins, 
  Search,
  ArrowRight,
  FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "introduction", title: "Introduction", icon: BookOpen },
  { id: "core-concepts", title: "Core Concepts", icon: Zap },
  { id: "getting-started", title: "Getting Started", icon: Settings },
  { id: "triggers", title: "Triggers", icon: Search },
  { id: "actions", title: "Actions", icon: ArrowRight },
  { id: "limits", title: "Limits & Pricing", icon: ShieldCheck },
  { id: "faq", title: "FAQ", icon: HelpCircle },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 container mx-auto flex gap-0 px-6 py-32">
        {/* Sticky Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border pr-8">
          <nav className="sticky top-32 space-y-1">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-3">
              On This Page
            </p>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all text-left",
                  activeSection === section.id 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <section.icon className={cn(
                  "h-4 w-4",
                  activeSection === section.id ? "text-primary" : "text-muted-foreground"
                )} />
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-12 max-w-4xl space-y-20 text-foreground leading-relaxed">
          {/* Introduction */}
          <section id="introduction" className="space-y-4 scroll-mt-32">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-foreground">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground">
              Welcome to the Flowentis documentation. Everything you need to know to build, manage, and scale your automated workflows.
            </p>
          </section>

          {/* Core Concepts */}
          <section id="core-concepts" className="space-y-6 scroll-mt-32 pt-10 border-t border-border">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              Core Concepts
            </h2>
            <div className="space-y-4">
              <p>
                Flowentis is built on a distributed architecture designed for reliability and speed. Understanding these three components is key to building effective automations:
              </p>
              <div className="grid gap-6 mt-6">
                <div className="p-6 rounded-xl border border-border bg-card/50">
                  <h3 className="text-lg font-bold mb-2">1. The Workflow</h3>
                  <p className="text-sm text-muted-foreground">A "Workflow" is your automated process. It always starts with one trigger and can have multiple actions following it.</p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-card/50">
                  <h3 className="text-lg font-bold mb-2">2. The Outbox Pattern</h3>
                  <p className="text-sm text-muted-foreground">To ensure no task is ever lost, we use a transactional outbox pattern. Triggers save events to the database first, which are then processed and sent to Kafka for execution.</p>
                </div>
                <div className="p-6 rounded-xl border border-border bg-card/50">
                  <h3 className="text-lg font-bold mb-2">3. The Worker</h3>
                  <p className="text-sm text-muted-foreground">Workers are specialized engines that consume events from the queue and perform the actual tasks (like sending emails or moving SOL) in a highly scalable way.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Getting Started */}
          <section id="getting-started" className="space-y-6 scroll-mt-32 pt-10 border-t border-border">
            <h2 className="text-3xl font-bold">Getting Started</h2>
            <div className="prose prose-invert max-w-none space-y-4 text-foreground">
              <p>Ready to automate? Follow these steps to create your first workflow:</p>
              <ol className="list-decimal pl-6 space-y-4">
                <li>
                  <strong>Connect Your Accounts:</strong> Navigate to the <Link href="/connections" className="text-primary hover:underline">Connections</Link> page. This is where you authorize Flowentis to interact with your Google Sheets or other OAuth-based services.
                </li>
                <li>
                  <strong>Open the Builder:</strong> Click "Create" on your dashboard. You'll see our visual node-based editor.
                </li>
                <li>
                  <strong>Select a Trigger:</strong> Click the top node to choose how your workflow starts. For example, choose "GitHub Trigger" for real-time repo monitoring.
                </li>
                <li>
                  <strong>Add Actions:</strong> Click the "+" icon below any node to add a new step. You can stack multiple actions in a single flow if you're on a Pro plan.
                </li>
              </ol>
            </div>
          </section>

          {/* Triggers */}
          <section id="triggers" className="space-y-8 scroll-mt-32 pt-10 border-t border-border">
            <h2 className="text-3xl font-bold">Available Triggers</h2>
            <div className="space-y-10">
              <div className="flex gap-6">
                <div className="h-12 w-12 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                  <Github className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">GitHub Webhooks</h3>
                  <p className="text-muted-foreground">React instantly to <code>Push</code>, <code>Issue</code>, or <code>Pull Request</code> events. Flowentis provides a custom endpoint for your repository.</p>
                  <Link href="/docs/github-webhook" className="text-sm text-primary flex items-center gap-1 hover:underline font-medium">
                    View Setup Guide <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="h-12 w-12 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 text-primary">
                  <Search className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Job Scrapers (LinkedIn & Indeed)</h3>
                  <p className="text-muted-foreground">Our background workers use Python-based scrapers to find jobs matching your exact keywords and location. New matches trigger your workflow automatically.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section id="actions" className="space-y-8 scroll-mt-32 pt-10 border-t border-border">
            <h2 className="text-3xl font-bold">Available Actions</h2>
            <div className="grid gap-8">
              <div className="flex gap-4 p-4 rounded-xl border border-border bg-card/30">
                <Mail className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h4 className="font-bold">Email (SMTP)</h4>
                  <p className="text-sm text-muted-foreground">Send custom emails via our high-deliverability SMTP server. Perfect for job alerts or repo notifications.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-border bg-card/30">
                <TableIcon className="h-6 w-6 text-green-500 shrink-0" />
                <div>
                  <h4 className="font-bold">Google Sheets</h4>
                  <p className="text-sm text-muted-foreground">Insert rows, update values, or create new sheets. Use the <code>{"{{trigger.<field_name>}}"}</code> syntax (e.g., <code>{"{{trigger.issue_title}}"}</code>) to map dynamic data.</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-border bg-card/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-orange-500/10 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-500/20 flex items-center gap-1">
                  <FlaskConical className="h-3 w-3" />
                  EXPERIMENTAL
                </div>
                <Coins className="h-6 w-6 text-orange-400 shrink-0" />
                <div>
                  <h4 className="font-bold">Solana Transfers</h4>
                  <p className="text-sm text-muted-foreground">Automate SOL transfers to any wallet address. Ideal for developer bounties or automated payments. <span className="text-orange-600/70 italic text-[11px] font-medium ml-1">*Mainnet feature coming soon.</span></p>
                </div>
              </div>
            </div>
          </section>

          {/* Limits */}
          <section id="limits" className="space-y-6 scroll-mt-32 pt-10 border-t border-border">
            <h2 className="text-3xl font-bold">Limits & Pricing</h2>
            <div className="border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-4 border-b border-border font-bold">Feature</th>
                    <th className="p-4 border-b border-border font-bold text-foreground">Basic (Free)</th>
                    <th className="p-4 border-b border-border font-bold text-primary">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 border-b border-border font-medium">Active Workflows</td>
                    <td className="p-4 border-b border-border">Up to 3</td>
                    <td className="p-4 border-b border-border font-semibold">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 border-b border-border font-medium">Steps per Workflow</td>
                    <td className="p-4 border-b border-border">1 Trigger + 1 Action</td>
                    <td className="p-4 border-b border-border font-semibold">Unlimited Steps</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 border-b border-border font-medium">Job Scraper Frequency</td>
                    <td className="p-4 border-b border-border">Every 24 hours</td>
                    <td className="p-4 border-b border-border font-semibold">Every 1 hour</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 border-b border-border font-medium">AI Generation</td>
                    <td className="p-4 border-b border-border">2 Lifetime Prompts</td>
                    <td className="p-4 border-b border-border font-semibold">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="space-y-8 scroll-mt-32 pt-10 border-t border-border pb-10">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-lg font-bold">How secure is my data?</h4>
                <p className="text-muted-foreground">We encrypt all OAuth tokens and sensitive configuration data using industry-standard AES-256 encryption. We never store your passwords.</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold">Can I use custom SMTP for emails?</h4>
                <p className="text-muted-foreground">Currently, we use our own managed SMTP for reliability. Custom SMTP support is on our roadmap for Q3 2026.</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold">How do I cancel my Pro subscription?</h4>
                <p className="text-muted-foreground">You can cancel anytime through your <Link href="/settings" className="text-primary hover:underline font-medium">Settings</Link> page. You'll retain Pro access until the end of your current billing period.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}
