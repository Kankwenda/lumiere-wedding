import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getBotUsername, isTelegramConfigured, sendTelegramText } from "./telegram.server";

/** Statut de la configuration Telegram du couple connecté. */
export const getTelegramStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: invitation } = await context.supabase
      .from("invitations")
      .select("telegram_chat_id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    return {
      botConfigured: isTelegramConfigured(),
      botUsername: await getBotUsername(),
      chatId: invitation?.telegram_chat_id ?? null,
    };
  });

/** Envoie un vrai message de test sur la discussion Telegram du couple. */
export const sendTestTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: invitation } = await context.supabase
      .from("invitations")
      .select("groom_first_name, bride_first_name, telegram_chat_id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!invitation?.telegram_chat_id) {
      throw new Error("Enregistrez d'abord votre identifiant de discussion Telegram.");
    }
    if (!isTelegramConfigured()) {
      throw new Error(
        "Le bot Telegram n'est pas configuré sur le serveur (variable TELEGRAM_BOT_TOKEN manquante).",
      );
    }
    const names = [invitation.groom_first_name, invitation.bride_first_name]
      .filter(Boolean)
      .join(" & ");
    const result = await sendTelegramText(
      [
        "✅ TEST DE CONNEXION",
        "",
        `Les notifications de votre mariage${names ? ` (${names})` : ""} fonctionnent.`,
        "Vous recevrez ici chaque réponse RSVP, choix de boisson et message du livre d'or.",
      ].join("\n"),
      invitation.telegram_chat_id,
    );
    if (!result.sent) {
      throw new Error(
        result.detail
          ? `Telegram a refusé l'envoi : ${result.detail}. Ouvrez le bot et envoyez-lui /start, puis réessayez.`
          : "Échec de l'envoi. Vérifiez l'identifiant et envoyez /start au bot.",
      );
    }
    return { ok: true };
  });
