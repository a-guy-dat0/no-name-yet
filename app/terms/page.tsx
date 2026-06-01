import Link from "next/link";
import TosContent from "@/components/TosContent";

export const metadata = { title: "{ask-it} — Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-300">← Back</Link>
      <TosContent />
    </div>
  );
}
