import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import ChatUI from "@/components/ChatUI";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }
  const usage = await getUsage(session.user.id);
  return <ChatUI initialUsage={usage} />;
}
