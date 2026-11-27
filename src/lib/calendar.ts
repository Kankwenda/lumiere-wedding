const pad = (n: number) => String(n).padStart(2, "0");

/** Date « flottante » (heure locale de l'invité) au format iCalendar / Google. */
function stamp(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export interface CalendarEventInput {
  title: string;
  start: Date;
  /** Durée en heures (8 par défaut). */
  hours?: number;
  location?: string;
  description?: string;
}

function endOf(e: CalendarEventInput) {
  return new Date(e.start.getTime() + (e.hours ?? 8) * 3_600_000);
}

export function buildIcs(e: CalendarEventInput, uid: string): string {
  const now = new Date();
  const created =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LUMIERE WEDDING//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@lumiere-wedding`,
    `DTSTAMP:${created}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(endOf(e))}`,
    `SUMMARY:${esc(e.title)}`,
    e.location ? `LOCATION:${esc(e.location)}` : "",
    e.description ? `DESCRIPTION:${esc(e.description)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function googleCalendarUrl(e: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(endOf(e))}`,
  });
  if (e.location) params.set("location", e.location);
  if (e.description) params.set("details", e.description);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
