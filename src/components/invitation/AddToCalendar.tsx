import { CalendarPlus, Download } from "lucide-react";
import {
  buildIcs,
  googleCalendarUrl,
  type CalendarEventInput,
} from "@/lib/calendar";

interface AddToCalendarProps {
  event: CalendarEventInput;
  fileName: string;
}

export function AddToCalendar({ event, fileName }: AddToCalendarProps) {
  const download = () => {
    const ics = buildIcs(event, fileName);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const common =
    "inline-flex flex-1 items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 inv-btn";

  return (
    <div className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row">
      <a
        href={googleCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        className={common}
        style={{ background: "var(--inv-primary)", color: "var(--inv-on-primary)" }}
      >
        <CalendarPlus className="h-4 w-4" aria-hidden />
        Google Agenda
      </a>
      <button
        type="button"
        onClick={download}
        className={common}
        style={{
          background: "transparent",
          color: "var(--inv-primary)",
          border: "1.5px solid var(--inv-primary)",
        }}
      >
        <Download className="h-4 w-4" aria-hidden />
        Apple / Outlook (.ics)
      </button>
    </div>
  );
}
