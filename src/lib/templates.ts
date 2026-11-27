import type { CSSProperties } from "react";
import type { DesignSettings, TemplateId } from "./types";

export interface InvitationTheme {
  id: TemplateId;
  name: string;
  tagline: string;
  /** Fond principal de la page */
  bg: string;
  /** Gradient décoratif du hero */
  heroGradient: string;
  /** Surface des cartes (verre / opaque) */
  surface: string;
  surfaceBorder: string;
  /** Couleur principale (boutons, titres forts) */
  primary: string;
  onPrimary: string;
  /** Texte courant */
  text: string;
  textSoft: string;
  /** Accent doré */
  accent: string;
  serif: string;
  sans: string;
  swatch: string[];
  /** Rayon des boutons (personnalisable). */
  btnRadius?: string;
}

export const INVITATION_THEMES: Record<TemplateId, InvitationTheme> = {
  elegance: {
    id: "elegance",
    name: "Élégance Ivoire",
    tagline: "Ivoire chaud, terracotta et cuivre",
    bg: "#faf5ec",
    heroGradient:
      "linear-gradient(165deg, #f3e7d3 0%, #e7d0b3 55%, #d8b58c 100%)",
    surface: "rgba(255, 253, 248, 0.85)",
    surfaceBorder: "rgba(176, 124, 79, 0.18)",
    primary: "#b4562a",
    onPrimary: "#fff8f1",
    text: "#46301d",
    textSoft: "#97816a",
    accent: "#c98d5f",
    serif: '"Cormorant Garamond", Georgia, serif',
    sans: '"Jost", sans-serif',
    swatch: ["#faf5ec", "#b4562a", "#c98d5f"],
  },
  lavender: {
    id: "lavender",
    name: "Lavender Romance",
    tagline: "Lavande, blanc ivoire et touches dorées",
    bg: "#f6f2fb",
    heroGradient:
      "linear-gradient(165deg, #f9f6fd 0%, #efe7f8 45%, #e4d7f2 100%)",
    surface: "rgba(255, 255, 255, 0.66)",
    surfaceBorder: "rgba(255, 255, 255, 0.85)",
    primary: "#7b68a8",
    onPrimary: "#fdfbff",
    text: "#3d2e5c",
    textSoft: "#7a6d94",
    accent: "#c3a266",
    serif: '"Cormorant Garamond", Georgia, serif',
    sans: '"Jost", sans-serif',
    swatch: ["#efe7f8", "#7b68a8", "#c3a266"],
  },
  royal: {
    id: "royal",
    name: "Royal Violet",
    tagline: "Violet profond et ivoire majestueux",
    bg: "#fbf7f0",
    heroGradient:
      "linear-gradient(160deg, #3a2456 0%, #2a1742 60%, #1f1132 100%)",
    surface: "rgba(255, 253, 248, 0.82)",
    surfaceBorder: "rgba(58, 36, 86, 0.12)",
    primary: "#3a2456",
    onPrimary: "#f7efe2",
    text: "#2a1a40",
    textSoft: "#6f6284",
    accent: "#c9a45f",
    serif: '"Cormorant Garamond", Georgia, serif',
    sans: '"Jost", sans-serif',
    swatch: ["#fbf7f0", "#3a2456", "#c9a45f"],
  },
  minimal: {
    id: "minimal",
    name: "Minimal Wedding",
    tagline: "Blanc, beige doux et lavande très léger",
    bg: "#ffffff",
    heroGradient:
      "linear-gradient(170deg, #ffffff 0%, #f6f2ec 60%, #eee8f4 100%)",
    surface: "rgba(250, 248, 244, 0.9)",
    surfaceBorder: "rgba(120, 105, 140, 0.14)",
    primary: "#a08fc4",
    onPrimary: "#ffffff",
    text: "#443d54",
    textSoft: "#8d8496",
    accent: "#d3c2a8",
    serif: '"Cormorant Garamond", Georgia, serif',
    sans: '"Jost", sans-serif',
    swatch: ["#ffffff", "#f0ebe2", "#a08fc4"],
  },
};

export const FONT_SERIFS: Record<NonNullable<DesignSettings["font"]>, string> = {
  cormorant: '"Cormorant Garamond", Georgia, serif',
  playfair: '"Playfair Display", Georgia, serif',
  lora: '"Lora", Georgia, serif',
  script: '"Great Vibes", "Cormorant Garamond", cursive',
  jost: '"Jost", system-ui, sans-serif',
};

const BUTTON_RADIUS: Record<NonNullable<DesignSettings["buttonStyle"]>, string> = {
  pill: "9999px",
  rounded: "1rem",
  square: "0.25rem",
};

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 1;
  const n = parseInt(m[1]!, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

/** Applique les réglages de design personnalisés par-dessus le modèle choisi. */
export function resolveTheme(
  template: TemplateId,
  design?: DesignSettings,
): InvitationTheme {
  const base = INVITATION_THEMES[template] ?? INVITATION_THEMES.lavender;
  if (!design) return base;
  const theme: InvitationTheme = {
    ...base,
    primary: design.primaryColor || base.primary,
    accent: design.secondaryColor || base.accent,
    bg: design.backgroundColor || base.bg,
    serif: (design.font && FONT_SERIFS[design.font]) || base.serif,
    btnRadius: (design.buttonStyle && BUTTON_RADIUS[design.buttonStyle]) || base.btnRadius,
  };
  // Lisibilité : le texte du bouton s'adapte à la couleur choisie…
  if (design.primaryColor) {
    theme.onPrimary = luminance(design.primaryColor) > 0.45 ? "#2a1a40" : "#ffffff";
  }
  // …et un fond sombre bascule les textes et surfaces en clair.
  if (design.backgroundColor && luminance(design.backgroundColor) < 0.25) {
    theme.text = "#f5efe6";
    theme.textSoft = "#cfc6d6";
    theme.surface = "rgba(255, 255, 255, 0.08)";
    theme.surfaceBorder = "rgba(255, 255, 255, 0.18)";
  }
  return theme;
}

export function themeVars(theme: InvitationTheme): CSSProperties {
  return {
    "--inv-bg": theme.bg,
    "--inv-hero": theme.heroGradient,
    "--inv-surface": theme.surface,
    "--inv-surface-border": theme.surfaceBorder,
    "--inv-primary": theme.primary,
    "--inv-on-primary": theme.onPrimary,
    "--inv-text": theme.text,
    "--inv-text-soft": theme.textSoft,
    "--inv-accent": theme.accent,
    "--inv-serif": theme.serif,
    "--inv-sans": theme.sans,
    "--inv-btn-radius": theme.btnRadius ?? "9999px",
  } as CSSProperties;
}
