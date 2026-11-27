import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import type { RsvpStatus } from "@/lib/types";

interface RSVPCardProps {
  guestName: string;
  status: RsvpStatus;
  onRespond: (status: "attending" | "declined") => Promise<void>;
  interactive: boolean;
}

export function RSVPCard({ guestName, status, onRespond, interactive }: RSVPCardProps) {
  const [current, setCurrent] = useState<RsvpStatus>(status);
  const [busy, setBusy] = useState<"attending" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstName = guestName.trim().split(/\s+/)[0];

  const respond = async (s: "attending" | "declined") => {
    if (!interactive || busy) return;
    setBusy(s);
    setError(null);
    try {
      await onRespond(s);
      setCurrent(s);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setBusy(null);
    }
  };

  if (current !== "pending") {
    return (
      <div
        className="animate-fade-up rounded-3xl p-8 text-center backdrop-blur-md sm:p-10"
        style={{ background: "var(--inv-surface)", border: "1px solid var(--inv-surface-border)" }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--inv-primary)", color: "var(--inv-on-primary)" }}
        >
          {current === "attending" ? <Check className="h-7 w-7" /> : <X className="h-7 w-7" />}
        </div>
        <p
          className="mt-5 font-serif text-2xl italic sm:text-3xl"
          style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
        >
          Merci {firstName}.
        </p>
        <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--inv-text-soft)" }}>
          Votre réponse a bien été enregistrée
          {current === "attending" ? " — nous avons hâte de vous voir !" : "."}
        </p>
        {interactive && (
          <button
            type="button"
            onClick={() => setCurrent("pending")}
            className="mt-5 text-xs font-medium uppercase tracking-widest underline underline-offset-4"
            style={{ color: "var(--inv-text-soft)" }}
          >
            Modifier ma réponse
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-8 text-center backdrop-blur-md sm:p-10"
      style={{ background: "var(--inv-surface)", border: "1px solid var(--inv-surface-border)" }}
    >
      <h3
        className="font-serif text-3xl font-medium sm:text-4xl"
        style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
      >
        Serez-vous parmi nous ?
      </h3>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!interactive || busy !== null}
          onClick={() => respond("attending")}
          className="inline-flex items-center justify-center gap-2 inv-btn px-6 py-3.5 text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: "var(--inv-primary)", color: "var(--inv-on-primary)" }}
        >
          {busy === "attending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Je serai présent
        </button>
        <button
          type="button"
          disabled={!interactive || busy !== null}
          onClick={() => respond("declined")}
          className="inline-flex items-center justify-center gap-2 inv-btn px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          style={{
            background: "transparent",
            color: "var(--inv-primary)",
            border: "1.5px solid var(--inv-primary)",
          }}
        >
          {busy === "declined" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Je suis indisponible
        </button>
      </div>
      {error && (
        <p className="mt-4 text-sm font-medium" style={{ color: "#b0443c" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
