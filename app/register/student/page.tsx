import { getAppLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { StudentRegisterForm } from "@/components/student-register-form";
import { UserPlus } from "lucide-react";

export default async function StudentRegisterPage() {
  const lang = await getAppLanguage();
  const t = createTranslator(lang);

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] relative overflow-hidden flex items-center justify-center p-6">
      {/* Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[var(--color-accent)] text-white shadow-xl shadow-blue-500/20 mb-6 rotate-3">
             <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[var(--color-ink)] tracking-tight mb-2">
            {t("register.studentTitle")}
          </h1>
          <p className="text-[var(--color-muted)] max-w-sm mx-auto font-medium">
            {t("register.studentSubtitle")}
          </p>
        </div>

        <div className="glass-card p-8 border border-white/20 shadow-2xl backdrop-blur-3xl">
          <StudentRegisterForm lang={lang} />
        </div>

        <div className="text-center mt-8">
           <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-widest">
              Smart Attendance AI • Security Infrastructure v2.4
           </p>
        </div>
      </div>
    </main>
  );
}
