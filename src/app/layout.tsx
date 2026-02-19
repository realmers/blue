import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";

/** Root metadata for the application shell. */
export const metadata: Metadata = {
  title: "Blue App",
  description: "blue app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

/** Root layout wrapping all pages with global providers and chrome. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="flex min-h-screen flex-col">
        <TRPCReactProvider>
          {/* Header */}
          <Header />

          <main className="flex-1">{children}</main>

          {/* Footer */}
          <Footer />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
