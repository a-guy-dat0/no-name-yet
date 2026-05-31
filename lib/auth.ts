import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tier: true, subscriptionStatus: true }
        });
        (session.user as any).tier = dbUser?.tier ?? 0;
        (session.user as any).subscriptionStatus = dbUser?.subscriptionStatus ?? null;
      }
      return session;
    }
  },
  pages: { signIn: "/" }
};
