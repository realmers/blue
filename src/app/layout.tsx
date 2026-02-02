import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { HeaderView } from "@/view/HeaderView";
import { FooterView } from "@/view/FooterView";

export const metadata: Metadata = {
  title: "Blue App",
  description: "blue app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="flex min-h-screen flex-col">
        <TRPCReactProvider>

          {/* Header */}
          <HeaderView />
          
          <main className="flex-1">
            {children}
          </main>
          
          {/* Footer */}
          <FooterView/>
          
          </TRPCReactProvider>
      </body>
    </html>
  );
}
