import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Invitation } from "@/lib/types";

/** Modèles de départ génériques, à adapter : aucun lieu ni adresse inventés. */
const DEFAULT_EVENTS = [
  { event_time: "10:00", title: "Cérémonie civile", sort_order: 1 },
  { event_time: "14:00", title: "Cérémonie religieuse", sort_order: 2 },
  { event_time: "18:00", title: "Vin d'honneur et dîner", sort_order: 3 },
  { event_time: "21:00", title: "Soirée dansante", sort_order: 4 },
];

const DEFAULT_DRESS_CODES = [
  { title: "Hommes", description: "Costume ou tenue élégante", sort_order: 1 },
  { title: "Dames", description: "Tenue chic et élégante", sort_order: 2 },
];

const DEFAULT_DRINKS = [
  { label: "Vin", alcoholic: true },
  { label: "Bière", alcoholic: true },
  { label: "Jus de fruits", alcoholic: false },
  { label: "Eau", alcoholic: false },
];

async function getOrCreateInvitation(): Promise<Invitation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: existing } = await supabase
    .from("invitations")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (existing) return existing as Invitation;

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({ owner_id: user.id })
    .select("*")
    .single();
  if (error) throw error;

  await Promise.all([
    supabase.from("program_events").insert(
      DEFAULT_EVENTS.map((e) => ({ ...e, invitation_id: invitation.id })),
    ),
    supabase.from("dress_codes").insert(
      DEFAULT_DRESS_CODES.map((d) => ({ ...d, invitation_id: invitation.id })),
    ),
    supabase.from("drink_options").insert(
      DEFAULT_DRINKS.map((d, i) => ({
        ...d,
        sort_order: i + 1,
        invitation_id: invitation.id,
      })),
    ),
  ]);

  return invitation as Invitation;
}

export function useInvitation() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["my-invitation"],
    queryFn: getOrCreateInvitation,
    staleTime: 30_000,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["my-invitation"] });

  return { invitation: query.data ?? null, isLoading: query.isLoading, error: query.error, refresh };
}
