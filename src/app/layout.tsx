import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: "Kapabara — POS & Inventory",
  description:
    "A warm, fast point-of-sale and inventory system for the Kapabara café.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF5EC" },
    { media: "(prefers-color-scheme: dark)", color: "#2A1F18" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${fraunces.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased">
        <SessionProvider>
          <TRPCReactProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "!bg-surface !text-fg !border-border-strong !rounded-xl !shadow-lg",
                  description: "!text-fg-muted",
                },
              }}
            />
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
