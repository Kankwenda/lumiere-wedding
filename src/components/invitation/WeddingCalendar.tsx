import { useMemo } from "react";
import { Heart } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

interface WeddingCalendarProps {
  date: Date;
}

/** Calendrier du mois du mariage avec le grand jour mis en évidence. */
export function WeddingCalendar({ date }: WeddingCalendarProps) {
  const cells = useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0

    const list: { day: number; current: boolean }[] = [];
    for (let i = offset - 1; i >= 0; i--) {
      list.push({ day: prevMonthDays - i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ day: d, current: true });
    }
    let next = 1;
    while (list.length % 7 !== 0) {
      list.push({ day: next++, current: false });
    }
    return list;
  }, [date]);

  const monthLabel = format(date, "MMMM yyyy", { locale: fr });
  const weddingDay = date.getDate();

  return (
    <div
      className="rounded-3xl p-6 sm:p-8"
      style={{
        background: "var(--inv-surface)",
        border: "1px solid var(--inv-surface-border)",
      }}
    >
      <h3
        className="text-center font-serif text-2xl font-medium capitalize sm:text-3xl"
        style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
      >
        {monthLabel}
      </h3>
      <div className="mt-5 grid grid-cols-7 gap-y-1.5 text-center" role="grid" aria-label={`Calendrier de ${monthLabel}`}>
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="pb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--inv-text-soft)" }}
          >
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          const isWedding = cell.current && cell.day === weddingDay;
          return (
            <span
              key={i}
              className="flex items-center justify-center py-0.5"
              aria-current={isWedding ? "date" : undefined}
            >
              <span
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums sm:h-10 sm:w-10"
                style={{
                  background: isWedding ? "var(--inv-primary)" : "transparent",
                  color: isWedding
                    ? "var(--inv-on-primary)"
                    : cell.current
                      ? "var(--inv-text)"
                      : "var(--inv-text-soft)",
                  opacity: cell.current ? 1 : 0.4,
                  fontWeight: isWedding ? 700 : 400,
                }}
              >
                {cell.day}
                {isWedding && (
                  <Heart
                    className="absolute -right-1 -top-1 h-3.5 w-3.5"
                    style={{ color: "var(--inv-accent)" }}
                    fill="currentColor"
                    strokeWidth={0}
                    aria-hidden
                  />
                )}
              </span>
            </span>
          );
        })}
      </div>
      <p
        className="mt-4 text-center text-xs font-medium uppercase tracking-[0.25em]"
        style={{ color: "var(--inv-primary)" }}
      >
        {format(date, "EEEE dd MMMM yyyy", { locale: fr })}
      </p>
    </div>
  );
}
