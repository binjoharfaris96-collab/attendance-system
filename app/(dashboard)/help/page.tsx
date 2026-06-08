import { redirect } from "next/navigation";

import { HelpCenter } from "@/components/help-center";
import { getSession } from "@/lib/auth";

export default async function HelpCenterPage() {
  const session = await getSession();
  if (session?.role === "parent") {
    redirect("/parent/help");
  }

  return <HelpCenter />;
}
