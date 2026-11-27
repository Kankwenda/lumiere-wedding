import { useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { PublicInvitationData, TemplateId } from "@/lib/types";
import { resolveTheme, themeVars } from "@/lib/templates";
import {
  saveDrinkSelections,
  submitGuestbookMessage,
  submitRsvp,
} from "@/lib/invite.functions";
import { Countdown } from "./Countdown";
import { InvitationHero } from "./InvitationHero";
import { WeddingCalendar } from "./WeddingCalendar";
import { ProgramTimeline } from "./ProgramTimeline";
import { DressCodeSection } from "./DressCodeSection";
import { RSVPCard } from "./RSVPCard";
import { DrinkPreferences } from "./DrinkPreferences";
import { GuestBook } from "./GuestBook";
import { QRCodeCard } from "./QRCodeCard";
import { AddToCalendar } from "./AddToCalendar";
import { coupleNames } from "@/lib/share";

interface InvitationViewProps {
  data: PublicInvitationData;
  token: string;
  /** false = aperçu (aucun appel serveur) */
  interactive?: boolean;
  /** Surcharge du modèle (aperçu design) */
  templateOverride?: TemplateId | undefined;
  inviteUrl?: string;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      className="mb-8 text-center font-serif text-3xl font-medium sm:text-4xl"
      style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
    >
      {children}
    </h2>
  );
}

export function InvitationView({
  data,
  token,
  interactive = true,
  templateOverride,
  inviteUrl,
}: InvitationViewProps) {
  const theme = resolveTheme(templateOverride ?? data.invitation.template, data.invitation.design);
  const doRsvp = useServerFn(submitRsvp);
  const doSaveDrinks = useServerFn(saveDrinkSelections);
  const doSubmitMessage = useServerFn(submitGuestbookMessage);

  const weddingDate = useMemo(
    () => new Date(`${data.invitation.wedding_date}T${data.invitation.wedding_time || "09:00"}`),
    [data.invitation.wedding_date, data.invitation.wedding_time],
  );
  const dateLabel = format(weddingDate, "dd MMMM yyyy", { locale: fr }).toUpperCase();
  const personalUrl = inviteUrl ?? (typeof window !== "undefined" ? `${window.location.origin}/invite/${token}` : `/invite/${token}`);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        ...themeVars(theme),
        background: theme.bg,
        color: theme.text,
        fontFamily: theme.sans,
      }}
    >
      <InvitationHero invitation={data.invitation} guest={data.guest} date={weddingDate} />

      <main className="mx-auto max-w-xl space-y-16 px-4 pb-20 sm:space-y-20 sm:px-6">
        <section aria-label="Compte à rebours" className="mt-10 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <Countdown target={weddingDate} />
        </section>

        <section aria-label="Calendrier du mariage" className="animate-fade-up" style={{ animationDelay: "0.45s" }}>
          <WeddingCalendar date={weddingDate} />
          <AddToCalendar
            fileName={`mariage-${data.invitation.wedding_date}`}
            event={{
              title: `Mariage de ${coupleNames(data.invitation)}`,
              start: weddingDate,
              location: data.invitation.location || undefined,
              description: data.invitation.welcome_message || undefined,
            }}
          />
        </section>

        <section aria-label="Programme de la journée">
          <SectionTitle>Programme</SectionTitle>
          <ProgramTimeline events={data.events} weddingDate={weddingDate} />
        </section>

        <section aria-label="Code vestimentaire">
          <SectionTitle>Code vestimentaire</SectionTitle>
          <DressCodeSection dressCodes={data.dressCodes} />
        </section>

        <section aria-label="Confirmation de présence">
          <RSVPCard
            guestName={data.guest.full_name}
            status={data.guest.rsvp_status}
            interactive={interactive}
            onRespond={async (status) => {
              await doRsvp({ data: { token, status } });
            }}
          />
        </section>

        <section aria-label="Préférences de boissons">
          <DrinkPreferences
            options={data.drinkOptions}
            selectedIds={data.selectedOptionIds}
            limit={data.invitation.drink_limit}
            interactive={interactive}
            onSave={async (ids) => {
              await doSaveDrinks({ data: { token, optionIds: ids } });
            }}
          />
        </section>

        <section aria-label="Livre d'or">
          <GuestBook
            initialMessage={data.myMessage}
            interactive={interactive}
            onSubmit={async (message) => {
              await doSubmitMessage({ data: { token, message } });
            }}
          />
        </section>

        <section aria-label="QR code personnel">
          <QRCodeCard url={personalUrl} guestName={data.guest.full_name} />
        </section>
      </main>

      <footer className="pb-10 text-center">
        <p
          className="font-serif text-lg italic"
          style={{ color: "var(--inv-text-soft)", fontFamily: "var(--inv-serif)" }}
        >
          {data.invitation.groom_first_name} & {data.invitation.bride_first_name} — {dateLabel}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.25em]" style={{ color: "var(--inv-text-soft)" }}>
          Créé avec LUMIÈRE WEDDING
        </p>
      </footer>
    </div>
  );
}
