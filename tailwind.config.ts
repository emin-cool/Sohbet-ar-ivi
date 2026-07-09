import type { Config } from "tailwindcss";

/**
 * Tasarım token'ları CLAUDE.md'deki Stitch tasarım sisteminden alınmıştır.
 * Renkler CSS değişkenlerine bağlanır (globals.css) — böylece Açık / Sepya / Koyu
 * temaları [data-theme] ile aynı Tailwind sınıfları üzerinden çalışır.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Yüzeyler
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        // Metin
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        // Vurgu (teal)
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-strong": "rgb(var(--accent-strong) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)",
        // Çizgiler ve etiketler
        line: "rgb(var(--line) / <alpha-value>)",
        chip: "rgb(var(--chip) / <alpha-value>)",
        "chip-fg": "rgb(var(--chip-fg) / <alpha-value>)",
        badge: "rgb(var(--badge) / <alpha-value>)",
        "badge-fg": "rgb(var(--badge-fg) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(31 41 55 / 0.04), 0 1px 3px rgb(31 41 55 / 0.06)",
        "card-hover": "0 4px 12px rgb(31 41 55 / 0.08)",
        player: "0 -1px 3px rgb(31 41 55 / 0.06), 0 -4px 16px rgb(31 41 55 / 0.08)",
      },
      maxWidth: {
        // Uzun okuma için içerik genişliği (~680px)
        reading: "680px",
        // Genel site genişliği
        site: "1200px",
      },
      fontSize: {
        // Uzun okuma gövdesi ~18px, satır yüksekliği 1.8
        reading: ["18px", { lineHeight: "1.8" }],
      },
    },
  },
  plugins: [],
};

export default config;
