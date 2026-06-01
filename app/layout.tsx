import "./globals.css";
import type { Metadata } from "next";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Nav from "@/components/Nav";
import DynamicBackground from "@/components/DynamicBackground";
import TosModal from "@/components/TosModal";

export const metadata: Metadata = {
  title: "{ask-it} — uncensored AI chat",
  description:
    "Chat with an uncensored open-source AI model. Pay only for what you use, cancel anytime."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DynamicBackground />
        {/* relative + z-index so all content sits above the z-0 orbs */}
        <div className="relative" style={{ zIndex: 1 }}>
          <SessionProviderWrapper>
            <TosModal />
            <Nav />
            <main>{children}</main>
          </SessionProviderWrapper>
        </div>
      </body>
    </html>
  );
}
