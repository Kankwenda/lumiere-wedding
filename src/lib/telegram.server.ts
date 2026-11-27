/**
 * Notifications Telegram — côté serveur uniquement.
 * Le token du bot ne quitte jamais le serveur. Aucun envoi n'est simulé :
 * si le bot n'est pas configuré, l'appelant en est informé explicitement.
 */

export interface TelegramNotification {
  guestName: string;
  invitationName: string;
  rsvpStatus?: "attending" | "declined" | null;
  drinks?: string[];
  guestbookMessage?: string | null;
  guestToken: string;
  kind: "rsvp" | "drinks" | "guestbook";
}

const KIND_TITLES: Record<TelegramNotification["kind"], string> = {
  rsvp: "💍 NOUVELLE RÉPONSE",
  drinks: "🥂 PRÉFÉRENCES BOISSONS",
  guestbook: "💬 LIVRE D'OR",
};

export function formatTelegramMessage(n: TelegramNotification): string {
  const line = "━━━━━━━━━━━━━━━━━━━━";
  const now = new Date().toLocaleString("fr-FR", {
    timeZone: process.env["APP_TIMEZONE"] || "Africa/Lubumbashi",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts: string[] = [line, KIND_TITLES[n.kind], line, "", "👤 INVITÉ", n.guestName, "", "💌 INVITATION", n.invitationName];
  if (n.rsvpStatus) {
    parts.push("", "📋 RSVP", n.rsvpStatus === "attending" ? "✅ Présent" : "❌ Indisponible");
  }
  if (n.drinks && n.drinks.length > 0) {
    parts.push("", "🥂 BOISSONS", ...n.drinks.map((d) => `• ${d}`));
  }
  if (n.guestbookMessage) {
    parts.push("", "💬 LIVRE D'OR", `"${n.guestbookMessage}"`);
  }
  parts.push("", "🕐 DATE", now, "", "🔑 INVITÉ ID", n.guestToken, line);
  return parts.join("\n");
}

export interface TelegramResult {
  sent: boolean;
  reason?: "not_configured" | "no_chat" | "failed";
  detail?: string;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env["TELEGRAM_BOT_TOKEN"]);
}

let cachedBotUsername: string | null = null;

/** Nom d'utilisateur public du bot (pour guider le couple), null si indisponible. */
export async function getBotUsername(): Promise<string | null> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return null;
  if (cachedBotUsername) return cachedBotUsername;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { username?: string } };
    cachedBotUsername = json.result?.username ?? null;
    return cachedBotUsername;
  } catch {
    return null;
  }
}

/** Envoie un texte brut. Ne lève jamais : le résultat décrit l'issue. */
export async function sendTelegramText(
  text: string,
  chatId: string | null | undefined,
): Promise<TelegramResult> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return { sent: false, reason: "not_configured" };
  const target = chatId || process.env["TELEGRAM_CHAT_ID"];
  if (!target) return { sent: false, reason: "no_chat" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: target, text }),
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const json = (await res.json()) as { description?: string };
        if (json.description) detail = json.description;
      } catch {
        /* corps non JSON */
      }
      console.error(`[TELEGRAM] Échec : ${detail}`);
      return { sent: false, reason: "failed", detail };
    }
    return { sent: true };
  } catch (error) {
    console.error("[TELEGRAM] Erreur réseau:", error);
    return { sent: false, reason: "failed", detail: "Erreur réseau" };
  }
}

/** Priorité à l'identifiant de discussion du couple, sinon repli global. */
export function sendTelegramNotification(
  notification: TelegramNotification,
  chatIdOverride?: string | null,
): Promise<TelegramResult> {
  return sendTelegramText(formatTelegramMessage(notification), chatIdOverride);
}
