export type RsvpStatus = "pending" | "attending" | "declined";

export type TemplateId = "elegance" | "lavender" | "royal" | "minimal";

export interface DesignSettings {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  font?: "cormorant" | "playfair" | "lora" | "script" | "jost";
  buttonStyle?: "rounded" | "pill" | "square";
  layout?: "classic" | "centered" | "editorial";
}

export interface Invitation {
  id: string;
  owner_id: string | null;
  groom_first_name: string;
  bride_first_name: string;
  family_name: string;
  wedding_date: string;
  wedding_time: string;
  location: string;
  welcome_message: string;
  couple_photo_url: string | null;
  template: TemplateId;
  design: DesignSettings;
  drink_limit: number;
  /** Identifiant de discussion Telegram du couple (notifications). */
  telegram_chat_id: string | null;
  /** Modèle de message de partage ({nom}, {maries}, {date}, {lien}). Vide = message par défaut. */
  share_message: string;
  /** Indicatif pays par défaut (ex. 243) pour les numéros locaux commençant par 0. */
  default_country_code: string;
  created_at: string;
}

export interface ProgramEvent {
  id: string;
  invitation_id: string;
  event_time: string;
  /** Date propre au moment (mariage sur plusieurs jours). null = jour du mariage. */
  event_date: string | null;
  title: string;
  venue: string | null;
  address: string | null;
  details: string;
  sort_order: number;
}

export interface DressCode {
  id: string;
  invitation_id: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface DrinkOption {
  id: string;
  invitation_id: string;
  label: string;
  alcoholic: boolean;
  sort_order: number;
  active: boolean;
}

export interface Guest {
  id: string;
  invitation_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  party_size: number;
  category: string;
  rsvp_status: RsvpStatus;
  rsvp_at: string | null;
  token: string;
  checked_in_at: string | null;
  created_at: string;
}

export interface GuestbookMessage {
  id: string;
  invitation_id: string;
  guest_id: string;
  message: string;
  created_at: string;
  guests?: { full_name: string } | null;
}

export interface PublicGuest {
  id: string;
  full_name: string;
  rsvp_status: RsvpStatus;
  party_size: number;
  checked_in_at: string | null;
}

export interface PublicInvitationData {
  invitation: Invitation;
  guest: PublicGuest;
  events: ProgramEvent[];
  dressCodes: DressCode[];
  drinkOptions: DrinkOption[];
  selectedOptionIds: string[];
  myMessage: string | null;
}

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  pending: "En attente",
  attending: "Présent",
  declined: "Indisponible",
};
