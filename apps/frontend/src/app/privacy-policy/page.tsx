"use client";

import React from "react";

export default function PrivacyPolicyPage() {
    return (
        <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-4 py-10 text-sm leading-relaxed text-foreground">
            <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">
                Last updated: {new Date().toISOString().split("T")[0]}
            </p>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">1. Introduction</h2>
                <p>
                    This Privacy Policy explains how we collect, use, and protect information when
                    you use my application ("Service"). This policy is specifically intended to
                    satisfy the requirements for the Google OAuth verification process.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">2. Information we collect</h2>
                <p>
                    When you sign in with Google, we may receive the following information from
                    Google, depending on the scopes you approve:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>Basic profile information (such as your name and profile picture)</li>
                    <li>Your Google account email address</li>
                    <li>Google account ID and related identifiers necessary for authentication</li>
                </ul>
                <p>
                    We do not collect your Google password, and we do not have access to any
                    content in your Google account (such as emails, files, or calendars) unless
                    explicitly stated and approved by you via additional scopes.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">3. How we use your information</h2>
                <p>Your Google account information is used solely for the following purposes:</p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>To authenticate you and allow you to sign in securely using Google OAuth</li>
                    <li>To create and manage your user account within the Service</li>
                    <li>
                        To connect your Google account so that you can browse your Google Sheets
                        spreadsheets (using scopes such as
                        <span className="font-mono"> https://www.googleapis.com/auth/spreadsheets </span>
                        and
                        <span className="font-mono"> https://www.googleapis.com/auth/drive.readonly </span>
                        )
                    </li>
                    <li>
                        To list the Google Sheets files in your Google Drive, read their metadata
                        (such as spreadsheet titles and sheet names), and, when you explicitly
                        configure and approve it, read and write cell values in the specific
                        spreadsheets you select
                    </li>
                    <li>
                        To perform the actions you configure in the application, such as appending
                        rows, appending columns, or creating new sheets in your selected
                        spreadsheets, based on the workflows or automations you set up
                    </li>
                    <li>To maintain the security and integrity of the Service</li>
                </ul>
                <p>
                    We do not sell or rent your personal information to any third parties, and we do
                    not use your Google account data for advertising or marketing purposes.
                </p>
                <p>
                    When you connect Google Sheets, we use your Google OAuth tokens as follows:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        A short-lived access token is used to make authorized requests to the Google
                        Sheets and Google Drive APIs on your behalf.
                    </li>
                    <li>
                        A refresh token (when provided by Google) may be stored securely in order to
                        obtain new access tokens, so that configured workflows and automations can
                        continue to operate without requiring you to re-authorize every time.
                    </li>
                </ul>
                <p>
                    Access is limited to spreadsheet files and related metadata needed to support
                    the features you use. The application does not intentionally access other file
                    types or unrelated Google Drive content.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">4. Data storage and retention</h2>
                <p>
                    We store only the minimum information required to operate the Service, such as
                    your user ID, email address, and (where applicable) the Google OAuth refresh
                    token that allows the Service to access your Google Sheets data on your
                    behalf. This information is retained for as long as your account remains
                    active or as needed to provide you with the Service.
                </p>
                <p>
                    You may request deletion of your account and associated data at any time by
                    contacting me using the details in the <strong>Contact me</strong> section
                    below. Subject to legal and regulatory requirements, we will delete or
                    anonymize your information, including stored refresh tokens used for Google
                    Sheets access.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">5. Data sharing and third parties</h2>
                <p>
                    We do not share your personal information with third parties except in the
                    following limited circumstances:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                    <li>
                        <span className="font-medium">Service providers:</span> Trusted vendors or
                        processors who help me operate the Service (such as hosting or analytics)
                        and who are bound by confidentiality and data protection obligations.
                    </li>
                    <li>
                        <span className="font-medium">Legal requirements:</span> When required to do
                        so by law, regulation, or valid legal process, or to protect my rights,
                        users, or the public.
                    </li>
                </ul>
                <p>
                    We do not use your Google data for advertising purposes and do not allow any
                    third parties to access your information for advertising or marketing based on
                    your Google account.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">6. Security</h2>
                <p>
                    We implement reasonable technical and organizational safeguards designed to
                    protect your information from unauthorized access, use, or disclosure.
                    However, no method of transmission over the internet or method of electronic
                    storage is 100% secure, and we cannot guarantee absolute security.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">7. Children&apos;s privacy</h2>
                <p>
                    The Service is not directed to children under 13, and we do not knowingly
                    collect personal information from children under 13. If you believe that a
                    child has provided me with personal information, please contact me so that I
                    can take appropriate action.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">8. Changes to this policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. When we do, we will revise
                    the "Last updated" date at the top of this page. Your continued use of the
                    Service after any changes become effective constitutes your acceptance of the
                    revised policy.
                </p>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-semibold">9. Contact us</h2>
                <p>
                    If you have any questions or concerns about this Privacy Policy or we
                    handling of your data, please contact me at:
                </p>
                <p className="font-medium">
                    Email: akoderohan490@gmail.com
                </p>
            </section>
        </main>
    );
}
