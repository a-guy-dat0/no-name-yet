// Chat page — server component loads session + initial usage, renders ChatLayout.
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import ChatLayout from "@/components/ChatLayout";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin");
  const usage = await getUsage(session.user.id);
  return <ChatLayout initialUsage={usage} />;
}
