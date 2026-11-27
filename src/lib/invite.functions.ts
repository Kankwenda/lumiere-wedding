import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  sendTelegramNotification,
  type TelegramNotification,
} from "./telegram.server";
import type { PublicInvitationData } from "./types";

const tokenSchema = z
  .string()
  .min(4)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, "Token invalide");

/**
 * Chaque flux invité est autorisé par son token personnel non prévisible.
 * Le client privilégié n'est chargé qu'après validation du token, et seules
 * les informations prévues pour cette invitation sont retournées.
 */
async function loadGuestBundle(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: guest } = await supabaseAdmin
    .from("guests")
    .select("id, full_name, rsvp_status, party_size, checked_in_at, invitation_id, token")
    .eq("token", token)
    .maybeSingle();
  if (!guest) return null;

  const { data: invitation } = await supabaseAdmin
    .from("invitations")
    .select("*")
    .eq("id", guest.invitation_id)
    .maybeSingle();
  if (!invitation) return null;

  const [events, dressCodes, drinkOptions, selections, message] =
    await Promise.all([
      supabaseAdmin
        .from("program_events")
        .select("*")
        .eq("invitation_id", invitation.id)
        .order("sort_order"),
      supabaseAdmin
        .from("dress_codes")
        .select("*")
        .eq("invitation_id", invitation.id)
        .order("sort_order"),
      supabaseAdmin
        .from("drink_options")
        .select("*")
        .eq("invitation_id", invitation.id)
        .eq("active", true)
        .order("sort_order"),
      supabaseAdmin
        .from("drink_selections")
        .select("option_id")
        .eq("guest_id", guest.id),
      supabaseAdmin
        .from("guestbook_messages")
        .select("message")
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return {
    invitation,
    guest,
    events: events.data ?? [],
    dressCodes: dressCodes.data ?? [],
    drinkOptions: drinkOptions.data ?? [],
    selectedOptionIds: (selections.data ?? []).map((s) => s.option_id),
    myMessage: message.data?.message ?? null,
  };
}

function notificationBase(bundle: NonNullable<Awaited<ReturnType<typeof loadGuestBundle>>>) {
  return {
    guestName: bundle.guest.full_name,
    invitationName:
      [bundle.invitation.groom_first_name, bundle.invitation.bride_first_name]
        .filter(Boolean)
        .join(" & ") || "Mon mariage",
    guestToken: bundle.guest.token,
  } satisfies Partial<TelegramNotification>;
}

export const getInvitationByToken = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ token: tokenSchema }).parse(data))
  .handler(async ({ data }): Promise<PublicInvitationData | null> => {
    const bundle = await loadGuestBundle(data.token);
    if (!bundle) return null;
    return {
      invitation: bundle.invitation as PublicInvitationData["invitation"],
      guest: {
        id: bundle.guest.id,
        full_name: bundle.guest.full_name,
        rsvp_status: bundle.guest.rsvp_status as PublicInvitationData["guest"]["rsvp_status"],
        party_size: bundle.guest.party_size,
        checked_in_at: bundle.guest.checked_in_at,
      },
      events: bundle.events,
      dressCodes: bundle.dressCodes,
      drinkOptions: bundle.drinkOptions,
      selectedOptionIds: bundle.selectedOptionIds,
      myMessage: bundle.myMessage,
    };
  });

export const submitRsvp = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: tokenSchema,
        status: z.enum(["attending", "declined"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const bundle = await loadGuestBundle(data.token);
    if (!bundle) throw new Error("Invitation introuvable");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("guests")
      .update({ rsvp_status: data.status, rsvp_at: new Date().toISOString() })
      .eq("id", bundle.guest.id);
    if (error) throw new Error("Impossible d'enregistrer la réponse");

    const drinkLabels = bundle.drinkOptions
      .filter((o) => bundle.selectedOptionIds.includes(o.id))
      .map((o) => o.label);

    await sendTelegramNotification(
      {
        ...notificationBase(bundle),
        kind: "rsvp",
        rsvpStatus: data.status,
        drinks: drinkLabels,
        guestbookMessage: bundle.myMessage,
      },
      bundle.invitation.telegram_chat_id,
    );

    return { ok: true, status: data.status };
  });

export const saveDrinkSelections = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: tokenSchema,
        optionIds: z.array(z.string().uuid()).max(20),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const bundle = await loadGuestBundle(data.token);
    if (!bundle) throw new Error("Invitation introuvable");

    const limit = Math.max(1, bundle.invitation.drink_limit ?? 2);
    if (data.optionIds.length > limit) {
      throw new Error(`Choisissez jusqu'à ${limit} boissons.`);
    }
    const validIds = new Set(bundle.drinkOptions.map((o) => o.id));
    for (const id of data.optionIds) {
      if (!validIds.has(id)) throw new Error("Boisson invalide");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("drink_selections").delete().eq("guest_id", bundle.guest.id);
    if (data.optionIds.length > 0) {
      const { error } = await supabaseAdmin.from("drink_selections").insert(
        data.optionIds.map((option_id) => ({
          guest_id: bundle.guest.id,
          option_id,
        })),
      );
      if (error) throw new Error("Impossible d'enregistrer vos préférences");
    }

    const labels = bundle.drinkOptions
      .filter((o) => data.optionIds.includes(o.id))
      .map((o) => o.label);
    if (labels.length > 0) {
      await sendTelegramNotification(
        {
          ...notificationBase(bundle),
          kind: "drinks",
          drinks: labels,
        },
        bundle.invitation.telegram_chat_id,
      );
    }

    return { ok: true };
  });

export const submitGuestbookMessage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        token: tokenSchema,
        message: z.string().trim().min(1, "Message vide").max(300),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const bundle = await loadGuestBundle(data.token);
    if (!bundle) throw new Error("Invitation introuvable");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Un message par invité : un nouvel envoi remplace le précédent.
    await supabaseAdmin.from("guestbook_messages").delete().eq("guest_id", bundle.guest.id);
    const { error } = await supabaseAdmin.from("guestbook_messages").insert({
      invitation_id: bundle.invitation.id,
      guest_id: bundle.guest.id,
      message: data.message,
    });
    if (error) throw new Error("Impossible d'ajouter votre message");

    await sendTelegramNotification(
      {
        ...notificationBase(bundle),
        kind: "guestbook",
        guestbookMessage: data.message,
      },
      bundle.invitation.telegram_chat_id,
    );

    return { ok: true };
  });
