import { useEffect, useRef, useState } from "react";
import { Wine, CheckCircle2 } from "lucide-react";
import type { DrinkOption } from "@/lib/types";

interface DrinkPreferencesProps {
  options: DrinkOption[];
  selectedIds: string[];
  limit: number;
  onSave: (ids: string[]) => Promise<void>;
  interactive: boolean;
}

export function DrinkPreferences({
  options,
  selectedIds,
  limit,
  onSave,
  interactive,
}: DrinkPreferencesProps) {
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enregistrement automatique (debounce) après chaque modification
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!interactive) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving(true);
      setSaved(false);
      setFailed(false);
      try {
        await onSave(selected);
        setSaved(true);
      } catch {
        setFailed(true);
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  if (options.length === 0) return null;

  const toggle = (id: string) => {
    if (!interactive) return;
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= limit) return prev;
      return [...prev, id];
    });
  };

  return (
    <div
      className="rounded-3xl p-8 backdrop-blur-md sm:p-10"
      style={{ background: "var(--inv-surface)", border: "1px solid var(--inv-surface-border)" }}
    >
      <div className="flex items-center justify-center gap-2.5">
        <Wine className="h-5 w-5" style={{ color: "var(--inv-accent)" }} aria-hidden />
        <h3
          className="font-serif text-2xl font-medium sm:text-3xl"
          style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
        >
          Quelle boisson souhaitez-vous ?
        </h3>
      </div>
      <p className="mt-2 text-center text-sm" style={{ color: "var(--inv-text-soft)" }}>
        Choisissez jusqu'à {limit} boisson{limit > 1 ? "s" : ""}.
      </p>

      <div className="mx-auto mt-6 grid max-w-sm gap-2.5" role="group" aria-label="Choix de boissons">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          const disabled = !checked && selected.length >= limit;
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl px-5 py-3.5 transition-all"
              style={{
                background: checked ? "var(--inv-primary)" : "transparent",
                border: `1.5px solid ${checked ? "var(--inv-primary)" : "var(--inv-surface-border)"}`,
                color: checked ? "var(--inv-on-primary)" : "var(--inv-text)",
                opacity: disabled ? 0.45 : 1,
                cursor: disabled || !interactive ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={disabled || !interactive}
                onChange={() => toggle(option.id)}
              />
              <span
                aria-hidden
                className="flex h-5 w-5 items-center justify-center rounded-md text-xs"
                style={{
                  border: `1.5px solid ${checked ? "var(--inv-on-primary)" : "var(--inv-text-soft)"}`,
                  background: checked ? "var(--inv-on-primary)" : "transparent",
                  color: "var(--inv-primary)",
                }}
              >
                {checked ? "✓" : ""}
              </span>
              <span className="text-sm font-medium sm:text-base">{option.label}</span>
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                style={{
                  background: checked ? "rgba(255,255,255,0.18)" : "var(--inv-bg)",
                  color: checked ? "var(--inv-on-primary)" : "var(--inv-text-soft)",
                }}
              >
                {option.alcoholic ? "Alcoolisée" : "Sans alcool"}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex h-5 items-center justify-center gap-1.5 text-sm" aria-live="polite">
        {saving && (
          <span style={{ color: "var(--inv-text-soft)" }}>Enregistrement…</span>
        )}
        {failed && !saving && (
          <span role="alert" style={{ color: "#b0443c" }}>
            Enregistrement impossible — vérifiez votre connexion et réessayez.
          </span>
        )}
        {saved && !saving && (
          <span className="inline-flex items-center gap-1.5" style={{ color: "var(--inv-primary)" }}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Vos préférences ont été enregistrées.
          </span>
        )}
      </div>
    </div>
  );
}
