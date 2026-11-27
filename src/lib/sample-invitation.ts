import { addDays, format } from "date-fns";
import type { PublicInvitationData } from "./types";

/**
 * Exemple d'invitation 100 % local pour la page « Voir les modèles ».
 * Rien n'est lu ni écrit en base : l'aperçu est non interactif.
 */
export function getSampleInvitation(): PublicInvitationData {
  const invitationId = "exemple";
  const ev = (
    i: number,
    time: string,
    title: string,
    venue: string,
    address: string,
  ) => ({
    id: `ev-${i}`,
    invitation_id: invitationId,
    event_time: time,
    event_date: null,
    title,
    venue,
    address,
    details: "",
    sort_order: i,
  });
  return {
    invitation: {
      id: invitationId,
      owner_id: null,
      groom_first_name: "Alexandre",
      bride_first_name: "Camille",
      family_name: "",
      wedding_date: format(addDays(new Date(), 120), "yyyy-MM-dd"),
      wedding_time: "14:00",
      location: "Votre lieu de réception",
      welcome_message:
        "Nous avons la joie de vous convier à célébrer notre mariage. Votre présence sera notre plus beau cadeau.",
      couple_photo_url: null,
      template: "elegance",
      design: {},
      drink_limit: 2,
      telegram_chat_id: null,
      share_message: "",
      default_country_code: "",
      created_at: new Date().toISOString(),
    },
    guest: {
      id: "guest-exemple",
      full_name: "Votre invité",
      rsvp_status: "pending",
      party_size: 2,
      checked_in_at: null,
    },
    events: [
      ev(1, "14:00", "Cérémonie", "Lieu de la cérémonie", "Adresse de la cérémonie"),
      ev(2, "17:00", "Vin d'honneur", "Lieu de la réception", "Adresse de la réception"),
      ev(3, "20:00", "Dîner et soirée", "Lieu de la réception", "Adresse de la réception"),
    ],
    dressCodes: [
      { id: "dc-1", invitation_id: invitationId, title: "Hommes", description: "Costume ou tenue élégante", sort_order: 1 },
      { id: "dc-2", invitation_id: invitationId, title: "Dames", description: "Tenue chic et élégante", sort_order: 2 },
    ],
    drinkOptions: [
      { id: "dr-1", invitation_id: invitationId, label: "Vin", alcoholic: true, sort_order: 1, active: true },
      { id: "dr-2", invitation_id: invitationId, label: "Jus de fruits", alcoholic: false, sort_order: 2, active: true },
      { id: "dr-3", invitation_id: invitationId, label: "Eau", alcoholic: false, sort_order: 3, active: true },
    ],
    selectedOptionIds: [],
    myMessage: null,
  };
}
