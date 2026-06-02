import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { SendVerificationRequestParams } from "next-auth/providers/email";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./db";

// Sends magic-link emails via Resend's HTTP API — no nodemailer required.
async function sendVerificationRequest({ identifier, url }: SendVerificationRequestParams) {
  const from = process.env.EMAIL_FROM ?? "noreply@example.com";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from,
      to: identifier,
      subject: "Your {ask-it} sign-in link",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#4f46e5">{ask-it}</h2>
          <p>Click the button below to sign in. This link expires in 24 hours and can only be used once.</p>
          <a href="${url}"
             style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
            Sign in to {ask-it}
          </a>
          <p style="color:#6b7280;font-size:13px">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${text}`);
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Magic-link email login — powered by Resend.
    EmailProvider({
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
      sendVerificationRequest
    })
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tier: true, subscriptionStatus: true, tosAcceptedAt: true, subscriptionEndsAt: true }
        });
        (session.user as any).tier = dbUser?.tier ?? 0;
        (session.user as any).subscriptionStatus = dbUser?.subscriptionStatus ?? null;
        (session.user as any).tosAcceptedAt = dbUser?.tosAcceptedAt?.toISOString() ?? null;
        (session.user as any).subscriptionEndsAt = dbUser?.subscriptionEndsAt?.toISOString() ?? null;
      }
      return session;
    }
  },
  pages: { signIn: "/signin" }
};
