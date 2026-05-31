import "./globals.css";
import type { Metadata } from "next";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "{no name yet} — uncensored AI chat",
  description:
    "Chat with an uncensored open-source AI model. Pay only for what you use, cancel anytime."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
