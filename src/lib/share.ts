import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Invitation } from "./types";

export const DEFAULT_SHARE_MESSAGE =
  "Bonjour {nom}, nous avons la joie de vous inviter au mariage de {maries}{date}. " +
  "Retrouvez le programme et confirmez votre présence ici : {lien}";

export const SHARE_PLACEHOLDERS = ["{nom}", "{maries}", "{date}", "{lien}"] as const;

export function coupleNames(inv: Pick<Invitation, "groom_first_name" | "bride_first_name">): string {
  return [inv.groom_first_name, inv.bride_first_name].filter(Boolean).join(" & ") || "nous";
}

export function buildShareMessage(
  inv: Pick<
    Invitation,
    "groom_first_name" | "bride_first_name" | "wedding_date" | "share_message"
  >,
  guestName: string,
  link: string,
): string {
  const template = inv.share_message?.trim() || DEFAULT_SHARE_MESSAGE;
  const date = inv.wedding_date
    ? ` le ${format(new Date(`${inv.wedding_date}T12:00:00`), "d MMMM yyyy", { locale: fr })}`
    : "";
  return template
    .replaceAll("{nom}", guestName)
    .replaceAll("{maries}", coupleNames(inv))
    .replaceAll("{date}", date)
    .replaceAll("{lien}", link);
}

/**
 * Numéro au format international (chiffres uniquement) pour wa.me.
 * Les numéros locaux commençant par 0 utilisent l'indicatif pays par défaut ;
 * sans indicatif, on renvoie null (WhatsApp proposera alors ses contacts).
 */
export function whatsappNumber(phone: string | null, countryCode: string): string | null {
  if (!phone) return null;
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (raw.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  const cc = countryCode.replace(/\D/g, "");
  if (digits.startsWith("0")) return cc ? cc + digits.slice(1) : null;
  if (cc && !digits.startsWith(cc) && digits.length <= 10) digits = cc + digits;
  return digits.length >= 8 ? digits : null;
}

export function whatsappUrl(number: string | null, text: string): string {
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}
