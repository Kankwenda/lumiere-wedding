import { Heart, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Invitation, PublicGuest } from "@/lib/types";

interface InvitationHeroProps {
  invitation: Invitation;
  guest: PublicGuest | null;
  date: Date;
}

export function InvitationHero({ invitation, guest, date }: InvitationHeroProps) {
  const dayName = format(date, "EEEE", { locale: fr }).toUpperCase();
  const dayNum = format(date, "dd");
  const monthName = format(date, "MMMM", { locale: fr }).toUpperCase();
  const year = format(date, "yyyy");

  return (
    <header className="px-4 pt-8 text-center sm:pt-12">
      <div className="mx-auto max-w-xl">
        {/* Carte photo */}
        <div
          className="animate-fade-up relative overflow-hidden rounded-[2rem]"
          style={{ boxShadow: "0 34px 80px -32px rgba(70, 48, 29, 0.45)" }}
        >
          <div className="aspect-[4/5] w-full">
            {invitation.couple_photo_url ? (
              <img
                src={invitation.couple_photo_url}
                alt={`${invitation.groom_first_name} et ${invitation.bride_first_name}`}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="h-full w-full" style={{ background: "var(--inv-hero)" }} />
            )}
          </div>

          {/* Voile dégradé */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/4"
            style={{
              background:
                "linear-gradient(to top, rgba(56, 36, 20, 0.85) 0%, rgba(56, 36, 20, 0.4) 45%, transparent 100%)",
            }}
          />

          {/* Noms + date */}
          <div className="absolute inset-x-0 bottom-0 px-5 pb-7">
            <Heart
              className="mx-auto h-6 w-6"
              style={{ color: "var(--inv-accent)" }}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
            <h1
              className="mt-3 font-serif text-[2.75rem] italic leading-[1.05] text-white sm:text-6xl"
              style={{
                fontFamily: "var(--inv-serif)",
                textShadow: "0 2px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              {invitation.groom_first_name}
              <Heart
                className="mx-2.5 inline-block h-6 w-6 align-baseline sm:h-8 sm:w-8"
                style={{ color: "var(--inv-accent)" }}
                fill="currentColor"
                strokeWidth={0}
                aria-label="et"
                role="img"
              />
              {invitation.bride_first_name}
            </h1>

            {/* Barre de date */}
            <div
              className="mx-auto mt-6 flex max-w-md items-center justify-center border-t pt-4"
              style={{ borderColor: "rgba(255, 255, 255, 0.35)" }}
            >
              <span className="flex-1 text-[11px] font-medium tracking-[0.3em] text-white/90">
                {dayName}
              </span>
              <span
                className="flex-1 border-x px-2"
                style={{ borderColor: "rgba(255, 255, 255, 0.35)" }}
              >
                <span
                  className="block font-serif text-3xl leading-none text-white"
                  style={{ fontFamily: "var(--inv-serif)" }}
                >
                  {dayNum}
                </span>
                <span className="mt-1 block text-[10px] font-medium tracking-[0.35em] text-white/90">
                  {monthName}
                </span>
              </span>
              <span className="flex-1 text-sm font-medium tracking-[0.3em] text-white/90">
                {year}
              </span>
            </div>
          </div>
        </div>

        {/* Sous la carte */}
        <p
          className="animate-fade-up mt-10 text-xs font-semibold uppercase tracking-[0.4em] sm:text-sm"
          style={{ color: "var(--inv-primary)", animationDelay: "0.15s" }}
        >
          Couple {invitation.groom_first_name} & {invitation.bride_first_name}
        </p>
        <span
          aria-hidden
          className="animate-fade-up mx-auto mt-5 block h-px w-16"
          style={{ background: "var(--inv-accent)", animationDelay: "0.2s" }}
        />
        <p
          className="animate-fade-up mx-auto mt-6 max-w-md text-[15px] leading-relaxed sm:text-base"
          style={{ color: "var(--inv-text-soft)", animationDelay: "0.25s" }}
        >
          {invitation.welcome_message}
        </p>
        {invitation.location && (
          <p
            className="animate-fade-up mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--inv-text)", animationDelay: "0.3s" }}
          >
            <MapPin className="h-4 w-4" style={{ color: "var(--inv-accent)" }} aria-hidden />
            {invitation.location}
          </p>
        )}
        {guest && (
          <p
            className="animate-fade-up mt-7 text-sm"
            style={{ color: "var(--inv-text-soft)", animationDelay: "0.35s" }}
          >
            Invitation personnelle de{" "}
            <span
              className="font-serif text-xl italic"
              style={{ color: "var(--inv-primary)", fontFamily: "var(--inv-serif)" }}
            >
              {guest.full_name}
            </span>
          </p>
        )}
      </div>
    </header>
  );
}
