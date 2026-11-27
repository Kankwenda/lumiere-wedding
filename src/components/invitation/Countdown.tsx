import { useEffect, useState } from "react";

interface CountdownProps {
  target: Date;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function Countdown({ target }: CountdownProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = now === null ? Number.POSITIVE_INFINITY : target.getTime() - now;
  const ready = now !== null;

  if (diff <= 0) {
    return (
      <div className="animate-fade-up text-center">
        <p
          className="font-serif text-3xl italic sm:text-4xl"
          style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
        >
          Le grand jour est arrivé.
        </p>
      </div>
    );
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  const units = [
    { value: ready ? String(days) : "–", label: "JOURS" },
    { value: ready ? pad(hours) : "––", label: "HEURES" },
    { value: ready ? pad(minutes) : "––", label: "MINUTES" },
    { value: ready ? pad(seconds) : "––", label: "SECONDES" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4" role="timer" aria-label="Compte à rebours avant le mariage">
      {units.map((u) => (
        <div
          key={u.label}
          className="rounded-2xl px-2 py-4 text-center shadow-sm backdrop-blur-md sm:py-6"
          style={{
            background: "var(--inv-surface)",
            border: "1px solid var(--inv-surface-border)",
          }}
        >
          <div
            className="font-serif text-3xl font-semibold tabular-nums sm:text-5xl"
            style={{ color: "var(--inv-primary)", fontFamily: "var(--inv-serif)" }}
          >
            {u.value}
          </div>
          <div
            className="mt-1 text-[10px] font-medium tracking-[0.2em] sm:text-xs"
            style={{ color: "var(--inv-text-soft)" }}
          >
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}
