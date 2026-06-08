import { switchDemoRole } from "@/app/actions/demo";
import { isDemoMode } from "@/lib/demo";

export function DemoModeBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4" /><path d="M12 17h.01" />
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      </svg>
      <span>DEMO MODE - Sample Data</span>
      <form action={switchDemoRole}>
        <button
          type="submit"
          className="ml-2 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          Switch Role
        </button>
      </form>
    </div>
  );
}
