import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Shirt } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import type { DressCode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard/dresscode")({
  component: DressCodePage,
});

const EMPTY = { title: "", description: "", sort_order: 1 };

function DressCodePage() {
  const { invitation, isLoading } = useInvitation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DressCode | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["dresscodes", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dress_codes")
        .select("*")
        .eq("invitation_id", invitation!.id)
        .order("sort_order");
      if (error) throw error;
      return data as DressCode[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["dresscodes", invitation?.id] });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setBusy(true);
    const payload = { title: form.title.trim(), description: form.description.trim(), sort_order: form.sort_order };
    const { error } = editing
      ? await supabase.from("dress_codes").update(payload).eq("id", editing.id)
      : await supabase.from("dress_codes").insert({ ...payload, invitation_id: invitation.id });
    setBusy(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    toast.success("Dress code mis à jour");
    setDialogOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("dress_codes").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
      return;
    }
    toast.success("Entrée supprimée");
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Dress code</h1>
          <p className="mt-1 text-sm text-muted-foreground">Guidez vos invités sur la tenue à porter.</p>
        </div>
        <Button className="rounded-full" onClick={() => { setEditing(null); setForm({ ...EMPTY, sort_order: items.length + 1 }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <div className="col-span-full rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-soft">
            <p className="font-serif text-2xl text-foreground">Aucune consigne</p>
          </div>
        )}
        {items.map((dc) => (
          <div key={dc.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shirt className="h-4.5 w-4.5" strokeWidth={1.7} />
            </span>
            <h3 className="mt-3 font-medium text-foreground">{dc.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dc.description}</p>
            <div className="mt-4 flex gap-1">
              <button
                onClick={() => { setEditing(dc); setForm({ title: dc.title, description: dc.description, sort_order: dc.sort_order }); setDialogOpen(true); }}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Modifier"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(dc.id)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing ? "Modifier" : "Nouvelle consigne"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dc-title">Titre</Label>
              <Input id="dc-title" required className="rounded-xl" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex. Hommes" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-desc">Description</Label>
              <Input id="dc-desc" required className="rounded-xl" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex. Costume élégant" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-order">Ordre</Label>
              <Input id="dc-order" type="number" min={1} className="rounded-xl" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 1 }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={busy} className="rounded-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
