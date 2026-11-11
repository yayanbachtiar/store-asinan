import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { Navigation } from "@/components/Navigation";
import { AiChatBubble } from "@/components/AiChatBubble";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-24 sm:px-5 sm:pb-16">
      <Navigation member={member} />
      <main>{children}</main>
      <AiChatBubble />
    </div>
  );
}
