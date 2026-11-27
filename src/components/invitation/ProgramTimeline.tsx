import { MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { mapsUrl } from "@/lib/calendar";
import type { ProgramEvent } from "@/lib/types";

interface ProgramTimelineProps {
  events: ProgramEvent[];
  /** Jour du mariage, utilisé pour les moments sans date propre. */
  weddingDate: Date;
}

interface Group {
  key: string;
  label: string | null;
  items: ProgramEvent[];
}

function sortEvents(events: ProgramEvent[], fallback: string) {
  return [...events].sort(
    (a, b) =>
      (a.event_date ?? fallback).localeCompare(b.event_date ?? fallback) ||
      a.sort_order - b.sort_order ||
      a.event_time.localeCompare(b.event_time),
  );
}

export function ProgramTimeline({ events, weddingDate }: ProgramTimelineProps) {
  if (events.length === 0) return null;

  const hasDates = events.some((e) => e.event_date);
  const fallback = format(weddingDate, "yyyy-MM-dd");
  const sorted = sortEvents(events, fallback);

  const groups: Group[] = [];
  for (const ev of sorted) {
    const key = hasDates ? (ev.event_date ?? fallback) : "all";
    const label = hasDates
      ? format(new Date(`${key}T12:00:00`), "EEEE dd MMMM", { locale: fr })
      : null;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(ev);
    else groups.push({ key, label, items: [ev] });
  }

  return (
    <div className="mx-auto max-w-lg space-y-10">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label ?? "Programme"}>
          {group.label && (
            <div className="mb-6 flex items-center justify-center gap-3">
              <span aria-hidden className="h-px w-8" style={{ background: "var(--inv-accent)" }} />
              <h3
                className="text-xs font-semibold uppercase tracking-[0.3em]"
                style={{ color: "var(--inv-primary)" }}
              >
                {group.label}
              </h3>
              <span aria-hidden className="h-px w-8" style={{ background: "var(--inv-accent)" }} />
            </div>
          )}
          <ol className="relative space-y-0">
            {group.items.map((event, i) => (
              <li key={event.id} className="relative flex gap-5 pb-10 last:pb-0">
                {i < group.items.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[52px] top-12 h-[calc(100%-2rem)] w-px"
                    style={{ background: "var(--inv-surface-border)" }}
                  />
                )}
                <div
                  className="w-11 shrink-0 pt-2.5 text-right text-sm font-semibold tabular-nums"
                  style={{ color: "var(--inv-primary)" }}
                >
                  {event.event_time.slice(0, 5)}
                </div>
                <span
                  aria-hidden
                  className="mt-3.5 h-3 w-3 shrink-0 rounded-full"
                  style={{
                    background: "var(--inv-accent)",
                    boxShadow: "0 0 0 4px var(--inv-bg)",
                  }}
                />
                <div
                  className="flex-1 rounded-2xl p-4 backdrop-blur-md sm:p-5"
                  style={{
                    background: "var(--inv-surface)",
                    border: "1px solid var(--inv-surface-border)",
                  }}
                >
                  <h4
                    className="font-serif text-2xl font-medium"
                    style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
                  >
                    {event.title}
                  </h4>
                  {event.venue && (
                    <p className="mt-1 text-sm font-medium" style={{ color: "var(--inv-text)" }}>
                      {event.venue}
                    </p>
                  )}
                  {event.address && (
                    <p
                      className="mt-1.5 flex items-start gap-1.5 text-sm"
                      style={{ color: "var(--inv-text-soft)" }}
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {event.address}
                    </p>
                  )}
                  {(event.venue || event.address) && (
                    <a
                      href={mapsUrl([event.venue, event.address].filter(Boolean).join(", "))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest underline underline-offset-4"
                      style={{ color: "var(--inv-primary)" }}
                    >
                      Itinéraire
                    </a>
                  )}
                  {event.details && (
                    <p
                      className="mt-2.5 border-t pt-2.5 text-sm leading-relaxed"
                      style={{
                        color: "var(--inv-text-soft)",
                        borderColor: "var(--inv-surface-border)",
                      }}
                    >
                      {event.details}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
