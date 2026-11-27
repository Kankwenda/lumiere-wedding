import { Sparkles } from "lucide-react";
import type { DressCode } from "@/lib/types";

export function DressCodeSection({ dressCodes }: { dressCodes: DressCode[] }) {
  if (dressCodes.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {dressCodes.map((dc) => (
        <div
          key={dc.id}
          className="rounded-2xl p-6 text-center backdrop-blur-md"
          style={{
            background: "var(--inv-surface)",
            border: "1px solid var(--inv-surface-border)",
          }}
        >
          <Sparkles
            className="mx-auto h-5 w-5"
            style={{ color: "var(--inv-accent)" }}
            strokeWidth={1.5}
            aria-hidden
          />
          <h3
            className="mt-3 font-serif text-xl font-medium"
            style={{ color: "var(--inv-text)", fontFamily: "var(--inv-serif)" }}
          >
            {dc.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--inv-text-soft)" }}>
            {dc.description}
          </p>
        </div>
      ))}
    </div>
  );
}
