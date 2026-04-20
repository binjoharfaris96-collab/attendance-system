import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getAppLanguage } from "@/lib/i18n-server";

export default async function OnboardingPage() {
  const session = await getSession();
  
  // If not logged in, go to login
  if (!session) {
    redirect("/login");
  }

  // If already has a role and (if parent) has a phone, go to dashboard
  // We check for "admin" or "owner" or "teacher"/"student" as valid roles.
  // We'll let voters decide if they want to re-onboard, but generally we only want incomplete users here.
  const isParentWithNoPhone = session.role === "parent" && !session.phone;
  const isGenericUser = session.role === "student" && !session.buildingId; // New users default to student
  
  // For now, only stay here if new or parent needs phone
  // We'll trust the callback redirect to bring them here.

  const lang = await getAppLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] p-6">
      <div className="w-full max-w-lg">
        <div className="card p-8 shadow-2xl border border-[var(--color-line)] bg-[var(--surface-1)]">
          <OnboardingForm lang={lang} />
        </div>
      </div>
    </main>
  );
}
