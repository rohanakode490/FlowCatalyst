import type { Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowCatalyst",
  description: "Automation app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
          />
          <Script
            src="https://apis.google.com/js/api.js"
            strategy="afterInteractive"
          />
          <Script
            src="https://apis.google.com/js/picker.js"
            strategy="afterInteractive"
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
