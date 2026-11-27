import { useState } from "react";
import { BookHeart, Send, Loader2 } from "lucide-react";

interface GuestBookProps {
  initialMessage: string | null;
  onSubmit: (message: string) => Promise<void>;
  interactive: boolean;
}

const MAX = 300;

export function GuestBook({ initialMessage, onSubmit, interactive }: GuestBookProps) {
  const [message, setMessage] = useState(initialMessage ?? "");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!interactive || busy || !message.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(message.trim());
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-3xl p-8 backdrop-blur-md sm:p-10"
      style={{ background: "var(--inv-surface)", border: "1px solid var(--inv-surface-border)" }}
    >
      <div className="flex items-center justify-center gap-2.5">
        <BookHeart className="h-5 w-5" style={{ color: "var(--inv-accent)" }} aria-hidden />
        <h3
          className="font-serif text-2xl font-medium sm:text-3xl"
          style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
        >
          Un mot pour les mariés ?
        </h3>
      </div>

      {sent && (
        <p
          className="animate-fade-in mt-4 text-center text-sm font-medium"
          style={{ color: "var(--inv-primary)" }}
          role="status"
        >
          Votre message a bien été ajouté au livre d'or.
        </p>
      )}

      <div className="mx-auto mt-6 max-w-md">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value.slice(0, MAX));
            setSent(false);
          }}
          rows={4}
          maxLength={MAX}
          disabled={!interactive || busy}
          placeholder="Écrivez vos vœux aux mariés…"
          aria-label="Message pour le livre d'or"
          className="w-full resize-none rounded-2xl px-5 py-4 text-sm leading-relaxed outline-none transition-shadow focus:shadow-md sm:text-base"
          style={{
            background: "var(--inv-bg)",
            border: "1px solid var(--inv-surface-border)",
            color: "var(--inv-text)",
          }}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs tabular-nums" style={{ color: "var(--inv-text-soft)" }}>
            {message.length} / {MAX}
          </span>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!interactive || busy || !message.trim()}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 inv-btn px-6 py-3.5 text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: "var(--inv-primary)", color: "var(--inv-on-primary)" }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Envoyer mon message
        </button>
        {error && (
          <p className="mt-3 text-center text-sm font-medium" style={{ color: "#b0443c" }} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
