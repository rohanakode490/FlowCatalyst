"use client";

import React from "react";
import Navbar from "@/components/globals/navbar";
import { Footer } from "@/components/footer/footer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function GitHubWebhookDocs() {
  return (
    <div className="min-h-screen flex flex-col bg-background [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_35%,var(--secondary)_100%)] bg-fixed">
      <Navbar />
      <main className="mx-auto flex flex-1 max-w-4xl flex-col gap-10 px-6 py-32 text-foreground">
        <Link 
          href="/docs" 
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Setting Up GitHub Webhooks</h1>
          <p className="text-xl text-muted-foreground">
            Learn how to connect your GitHub repositories to Flowentis.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Step-by-Step Instructions</h2>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 className="text-xl font-bold">1. Create a Zap</h3>
              <p>In the Flowentis dashboard, create a new workflow and select <strong>GitHub Trigger</strong>. Choose your event type (e.g., Issue Comment) and copy the generated Webhook URL.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold">2. Open GitHub Repository Settings</h3>
              <p>Go to the GitHub repository you want to monitor. Click on the <strong>Settings</strong> tab, then select <strong>Webhooks</strong> from the left sidebar.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold">3. Add Webhook</h3>
              <p>Click the <strong>Add webhook</strong> button in the top right corner.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold">4. Configure Webhook Details</h3>
              <ul className="list-disc space-y-2 pl-6">
                <li><strong>Payload URL:</strong> Paste the URL you copied from Flowentis.</li>
                <li><strong>Content type:</strong> Select <code>application/json</code>.</li>
                <li><strong>Secret:</strong> Leave this blank (unless configured in your flow).</li>
                <li><strong>SSL verification:</strong> Ensure "Enable SSL verification" is selected.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold">5. Select Events</h3>
              <p>Choose "Let me select individual events" and ensure you check the boxes that match your Flowentis trigger (e.g., <em>Issue comments</em>, <em>Pull requests</em>, or <em>Issues</em>).</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold">6. Save Webhook</h3>
              <p>Click <strong>Add webhook</strong>. GitHub will send a "ping" to Flowentis to verify the connection. You should see a green checkmark next to the webhook in GitHub if it was successful.</p>
            </div>
          </div>
        </section>

        <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
          <h3 className="font-bold">Pro Tip: Testing your webhook</h3>
          <p className="text-sm">
            Once configured, try performing the action in your GitHub repo (like leaving a comment). You can see the history of deliveries in the GitHub webhook settings page under the "Recent Deliveries" tab to debug any issues.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
