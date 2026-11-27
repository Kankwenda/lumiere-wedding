import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import { FONT_SERIFS, INVITATION_THEMES, type InvitationTheme } from "@/lib/templates";
import type {
  DesignSettings,
  DrinkOption,
  DressCode,
  ProgramEvent,
  PublicInvitationData,
  TemplateId,
} from "@/lib/types";
import { InvitationView } from "@/components/invitation/InvitationView";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/design")({
  component: DesignPage,
});

type FontId = NonNullable<DesignSettings["font"]>;
type ButtonStyle = NonNullable<DesignSettings["buttonStyle"]>;

const FONT_OPTIONS: { id: FontId; label: string; sample: string }[] = [
  { id: "cormorant", label: "Cormorant Garamond", sample: "Élégance classique" },
  { id: "playfair", label: "Playfair Display", sample: "Romantique affirmé" },
  { id: "lora", label: "Lora", sample: "Chaleureux et lisible" },
  { id: "script", label: "Great Vibes", sample: "Calligraphie manuscrite" },
  { id: "jost", label: "Jost", sample: "Moderne géométrique" },
];

const BUTTON_OPTIONS: { id: ButtonStyle; label: string; radius: string }[] = [
  { id: "pill", label: "Arrondi complet", radius: "9999px" },
  { id: "rounded", label: "Arrondi doux", radius: "1rem" },
  { id: "square", label: "Carré", radius: "0.25rem" },
];

function ColorField({
  label,
  value,
  fallback,
  onChange,
  onReset,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={label}
          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
          value={value ?? fallback}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="text-sm text-muted-foreground">{value ?? "Par défaut du modèle"}</span>
        {value && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto text-xs font-medium text-primary underline underline-offset-4"
          >
            Rétablir
          </button>
        )}
      </div>
    </div>
  );
}

function DesignPage() {
  const { invitation, isLoading, refresh } = useInvitation();
  const [template, setTemplate] = useState<TemplateId>("elegance");
  const [design, setDesign] = useState<DesignSettings>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!invitation) return;
    setTemplate(invitation.template);
    setDesign(invitation.design ?? {});
  }, [invitation]);

  const invId = invitation?.id;
  const { data: events = [] } = useQuery({
    queryKey: ["program", invId],
    enabled: !!invId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_events")
        .select("*")
        .eq("invitation_id", invId!)
        .order("sort_order")
        .order("event_time");
      if (error) throw error;
      return data as ProgramEvent[];
    },
  });
  const { data: dressCodes = [] } = useQuery({
    queryKey: ["dresscodes", invId],
    enabled: !!invId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dress_codes")
        .select("*")
        .eq("invitation_id", invId!)
        .order("sort_order");
      if (error) throw error;
      return data as DressCode[];
    },
  });
  const { data: drinks = [] } = useQuery({
    queryKey: ["drinks", invId],
    enabled: !!invId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drink_options")
        .select("*")
        .eq("invitation_id", invId!)
        .order("sort_order");
      if (error) throw error;
      return data as DrinkOption[];
    },
  });

  // Aperçu en direct : vos vraies données, avec le design en cours d'édition.
  const previewData = useMemo<PublicInvitationData | null>(() => {
    if (!invitation) return null;
    return {
      invitation: { ...invitation, template, design },
      guest: {
        id: "apercu",
        full_name: "Prénom Nom",
        rsvp_status: "pending",
        party_size: 2,
        checked_in_at: null,
      },
      events,
      dressCodes,
      drinkOptions: drinks.filter((d) => d.active),
      selectedOptionIds: [],
      myMessage: null,
    };
  }, [invitation, template, design, events, dressCodes, drinks]);

  const dirty =
    !!invitation &&
    (template !== invitation.template ||
      JSON.stringify(design) !== JSON.stringify(invitation.design ?? {}));

  const save = async () => {
    if (!invitation) return;
    setBusy(true);
    const { error } = await supabase
      .from("invitations")
      .update({ template, design: JSON.parse(JSON.stringify(design)) })
      .eq("id", invitation.id);
    setBusy(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    toast.success("Design enregistré");
    refresh();
  };

  const pickTemplate = (t: InvitationTheme) => {
    setTemplate(t.id);
    setDesign({});
  };

  const patch = (p: Partial<DesignSettings>) => setDesign((d) => ({ ...d, ...p }));
  const clear = (key: keyof DesignSettings) =>
    setDesign((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });

  if (isLoading || !invitation || !previewData) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const base = INVITATION_THEMES[template];
  const font = design.font ?? "cormorant";
  const btn = design.buttonStyle ?? "pill";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Design</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un modèle et personnalisez couleurs, typographie et boutons. L'aperçu utilise
          vos vraies informations.
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <h2 className="font-serif text-xl font-semibold text-foreground">Modèle</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(INVITATION_THEMES).map((t) => {
            const active = template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTemplate(t)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 text-left transition-all",
                  active ? "border-primary shadow-lavender" : "border-border hover:border-primary/40",
                )}
              >
                <div className="h-24 w-full" style={{ background: t.bg }}>
                  <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4">
                    <span className="h-px w-10" style={{ background: t.accent }} />
                    <span className="text-lg leading-none" style={{ color: t.text, fontFamily: t.serif }}>
                      {t.name.split(" ")[0]}
                    </span>
                    <span className="flex gap-1">
                      {t.swatch.map((c) => (
                        <span key={c} className="h-3 w-3 rounded-full border border-black/10" style={{ background: c }} />
                      ))}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.tagline}</p>
                  </div>
                  {active && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-foreground">Personnalisation</h2>

          <ColorField
            label="Couleur principale (boutons, accents forts)"
            value={design.primaryColor}
            fallback={base.primary}
            onChange={(v) => patch({ primaryColor: v })}
            onReset={() => clear("primaryColor")}
          />
          <ColorField
            label="Couleur secondaire (filets, icônes)"
            value={design.secondaryColor}
            fallback={base.accent}
            onChange={(v) => patch({ secondaryColor: v })}
            onReset={() => clear("secondaryColor")}
          />
          <ColorField
            label="Couleur de fond"
            value={design.backgroundColor}
            fallback={base.bg}
            onChange={(v) => patch({ backgroundColor: v })}
            onReset={() => clear("backgroundColor")}
          />

          <div className="space-y-2">
            <Label>Typographie des titres</Label>
            <div className="grid gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => patch({ font: f.id })}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                    font === f.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.label}</p>
                    <p className="text-base text-muted-foreground" style={{ fontFamily: FONT_SERIFS[f.id] }}>
                      {f.sample}
                    </p>
                  </div>
                  {font === f.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forme des boutons</Label>
            <div className="grid grid-cols-3 gap-2">
              {BUTTON_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => patch({ buttonStyle: b.id })}
                  className={cn(
                    "border px-3 py-2.5 text-xs font-medium transition-colors",
                    btn === b.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary/40",
                  )}
                  style={{ borderRadius: b.radius }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              type="button"
              onClick={() => setDesign({})}
              disabled={Object.keys(design).length === 0}
              className="rounded-full py-5 text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            <Button onClick={save} disabled={busy || !dirty} className="flex-1 rounded-full py-5 text-sm font-semibold">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Enregistrer le design" : "Design à jour"}
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Aperçu en direct{dirty ? " — modifications non enregistrées" : ""}
            </p>
          </div>
          <div className="h-[640px] overflow-y-auto">
            <InvitationView data={previewData} token="apercu" interactive={false} />
          </div>
        </section>
      </div>
    </div>
  );
}
