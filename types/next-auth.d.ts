import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tier: 0 | 1 | 2 | 3;
      subscriptionStatus: string | null;
      tosAcceptedAt: string | null;
    };
  }
}
