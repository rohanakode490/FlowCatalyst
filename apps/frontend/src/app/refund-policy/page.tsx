"use client";

import React from "react";

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-4 py-10 text-sm leading-relaxed text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight">Refund Policy</h1>
      <p className="text-muted-foreground">
        Last updated: {new Date().toISOString().split("T")[0]}
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Overview</h2>
        <p>
          At Flowentis, we want you to be satisfied with our service. This Refund Policy explains the conditions under which we offer refunds for our subscription plans.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Eligibility for Refund</h2>
        <p>
          We offer a 7-day money-back guarantee for all new subscriptions. If you are not satisfied with the service, you may request a full refund within 7 days of your initial purchase.
        </p>
        <p>
          To be eligible for a refund, the following conditions must be met:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>The request must be made within 7 days of the transaction date.</li>
          <li>The account must not have violated our terms of service.</li>
          <li>Excessive use of AI-generated workflows or job scraping during the 7-day period may result in a partial refund or denial of the request at our discretion.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Non-Refundable Items</h2>
        <p>
          The following are generally non-refundable:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Renewal payments (unless requested within 48 hours of the renewal and the service has not been used since renewal).</li>
          <li>Partial months of service after the initial 7-day period.</li>
          <li>Amounts paid for custom development or enterprise setup fees.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. How to Request a Refund</h2>
        <p>
          To request a refund, please email us at <span className="font-medium">akoderohan490@gmail.com</span> with your account email address and the reason for the request. We aim to process all refund requests within 5-7 business days.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Cancellation</h2>
        <p>
          You can cancel your subscription at any time through your account settings. Upon cancellation, you will continue to have access to the Pro features until the end of your current billing period, but no further charges will be made.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Changes to this Policy</h2>
        <p>
          We reserve the right to modify this Refund Policy at any time. Any changes will be posted on this page with an updated "Last updated" date.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">7. Contact Us</h2>
        <p>
          If you have any questions about our Refund Policy, please contact us at:
        </p>
        <p className="font-medium">Email: akoderohan490@gmail.com</p>
      </section>
    </main>
  );
}
