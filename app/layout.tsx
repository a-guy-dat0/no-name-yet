import "./globals.css";
import type { Metadata } from "next";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Nav from "@/components/Nav";
import DynamicBackground from "@/components/DynamicBackground";

export const metadata: Metadata = {
  title: "{no name yet} — uncensored AI chat",
  description:
    "Chat with an uncensored open-source AI model. Pay only for what you use, cancel anytime."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DynamicBackground />
        <SessionProviderWrapper>
          <Nav />
          {/* Chat page manages its own full-height layout; other pages get the centered wrapper */}
          <main>{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
