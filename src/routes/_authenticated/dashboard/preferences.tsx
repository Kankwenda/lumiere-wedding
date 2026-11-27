import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Wine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import type { DrinkOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/preferences")({
  component: PreferencesPage,
});

const QUICK_DRINKS = [
  { label: "Vin rouge", alcoholic: true },
  { label: "Champagne", alcoholic: true },
  { label: "Dopel", alcoholic: true },
  { label: "N'tay", alcoholic: true },
  { label: "Jus de gingembre", alcoholic: false },
  { label: "Sucré", alcoholic: false },
  { label: "Soda", alcoholic: false },
];

function PreferencesPage() {
  const { invitation, isLoading } = useInvitation();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [alcoholic, setAlcoholic] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: options = [] } = useQuery({
    queryKey: ["drinks", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drink_options")
        .select("*")
        .eq("invitation_id", invitation!.id)
        .order("sort_order");
      if (error) throw error;
      return data as DrinkOption[];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["drink-counts", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drink_selections")
        .select("option_id, drink_options!inner(invitation_id)")
        .eq("drink_options.invitation_id", invitation!.id);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data) map[row.option_id] = (map[row.option_id] ?? 0) + 1;
      return map;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["drinks", invitation?.id] });
    queryClient.invalidateQueries({ queryKey: ["drink-counts", invitation?.id] });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !label.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from("drink_options")
      .insert({ label: label.trim(), alcoholic, invitation_id: invitation.id, sort_order: options.length + 1 });
    setBusy(false);
    if (error) {
      toast.error("Ajout impossible", { description: error.message });
      return;
    }
    setLabel("");
    setAlcoholic(false);
    toast.success("Boisson ajoutée");
    refresh();
  };

  const addQuick = async (s: { label: string; alcoholic: boolean }) => {
    if (!invitation) return;
    const { error } = await supabase
      .from("drink_options")
      .insert({ ...s, invitation_id: invitation.id, sort_order: options.length + 1 });
    if (error) {
      toast.error("Ajout impossible", { description: error.message });
      return;
    }
    refresh();
  };

  const toggle = async (opt: DrinkOption) => {
    const { error } = await supabase.from("drink_options").update({ active: !opt.active }).eq("id", opt.id);
    if (error) {
      toast.error("Mise à jour impossible", { description: error.message });
      return;
    }
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("drink_options").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
      return;
    }
    toast.success("Boisson supprimée");
    refresh();
  };

  if (isLoading || !invitation) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Préférences de boissons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chaque invité choisit jusqu'à {invitation.drink_limit} boisson{invitation.drink_limit > 1 ? "s" : ""} sur son invitation.
        </p>
      </div>

      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <Input
          className="min-w-0 flex-1 rounded-full bg-card"
          placeholder="Ex. Jus de gingembre"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={alcoholic}
            onChange={(e) => setAlcoholic(e.target.checked)}
            className="accent-primary"
          />
          Alcoolisée
        </label>
        <Button type="submit" disabled={busy || !label.trim()} className="rounded-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ajouter
        </Button>
      </form>

      {(() => {
        const existing = new Set(options.map((o) => o.label.trim().toLowerCase()));
        const todo = QUICK_DRINKS.filter((d) => !existing.has(d.label.toLowerCase()));
        if (todo.length === 0) return null;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Ajout rapide :</span>
            {todo.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => addQuick(d)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-accent"
              >
                + {d.label}
              </button>
            ))}
          </div>
        );
      })()}

      <div className="space-y-3">
        {options.length === 0 && (
          <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-soft">
            <p className="font-serif text-2xl text-foreground">Aucune boisson proposée</p>
          </div>
        )}
        {options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wine className="h-4.5 w-4.5" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{opt.label}</p>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {opt.alcoholic ? "Alcoolisée" : "Sans alcool"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {counts[opt.id] ?? 0} invité{(counts[opt.id] ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={() => toggle(opt)} title={opt.active ? "Masquer" : "Afficher"}>
              <Badge variant={opt.active ? "default" : "secondary"} className="cursor-pointer rounded-full">
                {opt.active ? "Visible" : "Masquée"}
              </Badge>
            </button>
            <button onClick={() => remove(opt.id)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
