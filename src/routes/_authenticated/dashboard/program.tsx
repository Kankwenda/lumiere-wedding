import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import type { ProgramEvent } from "@/lib/types";
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

export const Route = createFileRoute("/_authenticated/dashboard/program")({
  component: ProgramPage,
});

interface EventForm {
  event_date: string;
  event_time: string;
  title: string;
  venue: string;
  address: string;
  details: string;
  sort_order: number;
}

const EMPTY: EventForm = {
  event_date: "",
  event_time: "09:00",
  title: "",
  venue: "",
  address: "",
  details: "",
  sort_order: 1,
};

function ProgramPage() {
  const { invitation, isLoading } = useInvitation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY);
  const [busy, setBusy] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["program", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_events")
        .select("*")
        .eq("invitation_id", invitation!.id)
        .order("sort_order")
        .order("event_time");
      if (error) throw error;
      return data as ProgramEvent[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["program", invitation?.id] });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: events.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (ev: ProgramEvent) => {
    setEditing(ev);
    setForm({
      event_date: ev.event_date ?? "",
      event_time: ev.event_time.slice(0, 5),
      title: ev.title,
      venue: ev.venue ?? "",
      address: ev.address ?? "",
      details: ev.details ?? "",
      sort_order: ev.sort_order,
    });
    setDialogOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setBusy(true);
    const payload = {
      event_date: form.event_date || null,
      event_time: form.event_time,
      title: form.title.trim(),
      venue: form.venue.trim() || null,
      address: form.address.trim() || null,
      details: form.details.trim(),
      sort_order: form.sort_order,
    };
    const { error } = editing
      ? await supabase.from("program_events").update(payload).eq("id", editing.id)
      : await supabase.from("program_events").insert({ ...payload, invitation_id: invitation.id });
    setBusy(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    toast.success("Programme mis à jour");
    setDialogOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("program_events").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
      return;
    }
    toast.success("Moment supprimé");
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
          <h1 className="font-serif text-3xl font-semibold text-foreground">Programme</h1>
          <p className="mt-1 text-sm text-muted-foreground">Le déroulé de votre journée, visible par les invités.</p>
        </div>
        <Button className="rounded-full" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Ajouter un moment
        </Button>
      </div>

      <div className="space-y-3">
        {events.length === 0 && (
          <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-soft">
            <p className="font-serif text-2xl text-foreground">Aucun moment prévu</p>
            <p className="mt-2 text-sm text-muted-foreground">Ajoutez la cérémonie, le vin d'honneur, la soirée…</p>
          </div>
        )}
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-3.5 w-3.5" />
              <span className="mt-0.5 text-xs font-bold">{ev.event_time.slice(0, 5)}</span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{ev.title}</p>
                {ev.event_date && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium capitalize text-secondary-foreground">
                    {format(new Date(`${ev.event_date}T12:00:00`), "EEE dd MMM", { locale: fr })}
                  </span>
                )}
              </div>
              {(ev.venue || ev.address) && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {[ev.venue, ev.address].filter(Boolean).join(" — ")}
                </p>
              )}
              {ev.details && (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {ev.details}
                </p>
              )}
            </div>
            <button onClick={() => openEdit(ev)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="Modifier">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => remove(ev.id)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editing ? "Modifier" : "Nouveau moment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="e-date">Date</Label>
                <Input id="e-date" type="date" className="rounded-xl" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
                <p className="text-[11px] text-muted-foreground">Vide = jour du mariage</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-time">Heure</Label>
                <Input id="e-time" type="time" required className="rounded-xl" value={form.event_time} onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-order">Ordre</Label>
                <Input id="e-order" type="number" min={1} className="rounded-xl" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 1 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-title">Titre</Label>
              <Input id="e-title" required className="rounded-xl" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex. Cérémonie" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-venue">Lieu</Label>
              <Input id="e-venue" className="rounded-xl" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="Ex. Église Saint-Pierre" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-address">Adresse</Label>
              <Input id="e-address" className="rounded-xl" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-details">Détails</Label>
              <textarea
                id="e-details"
                rows={2}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.details}
                onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                placeholder="Ex. Merci d'arriver 30 minutes en avance"
              />
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
