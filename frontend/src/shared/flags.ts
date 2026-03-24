type Flags = {
  HEAVY_MEDIA: boolean;
  UV_SIMULATOR: boolean;
  AB_CTA: "ctaA" | "ctaB";
};

const env = (k: string, d?: string) => (import.meta.env[k] ?? d) as string;

export const flags: Flags = {
  HEAVY_MEDIA: String(env("VITE_FLAG_HEAVY_MEDIA", "false")) === "true",
  UV_SIMULATOR: String(env("VITE_FLAG_UV_SIMULATOR", "false")) === "true",
  AB_CTA: env("VITE_FLAG_AB_CTA", "ctaA") as "ctaA" | "ctaB",
};

export function useFlag(key: keyof Flags) {
  return flags[key];
}

export function ab<T>(opts: Record<Flags["AB_CTA"], T>): T {
  return opts[flags.AB_CTA];
}
