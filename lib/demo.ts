import "server-only";

export const DEMO_EMAIL_DOMAIN = "schooldemo.edu";
export const DEMO_OWNER_EMAIL = `owner@${DEMO_EMAIL_DOMAIN}`;
export const DEMO_SEED_KEY = "demo_seeded_v1";

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function getDemoRedirectForRole(role: string) {
  switch (role) {
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    case "parent":
      return "/parent";
    case "owner":
    case "admin":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

export function demoPhotoUrl(seed: string) {
  return `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
