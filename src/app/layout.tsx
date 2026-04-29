import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroller } from "@/components/SmoothScroller";

export const metadata: Metadata = {
  title: "Netvora Academy | Build Networks. Secure Systems.",
  description: "AI-powered LMS for training industry-ready network engineers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id-ID" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SmoothScroller>
          {children}
        </SmoothScroller>
      </body>
    </html>
  );
}
