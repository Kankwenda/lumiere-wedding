import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import { PhotoUpload } from "@/components/photo-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/invitation")({
  component: InvitationEditPage,
});

function InvitationEditPage() {
  const { invitation, isLoading, refresh } = useInvitation();
  const [form, setForm] = useState({
    groom_first_name: "",
    bride_first_name: "",
    family_name: "",
    wedding_date: "",
    wedding_time: "09:00",
    location: "",
    welcome_message: "",
    drink_limit: 2,
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!invitation) return;
    setForm({
      groom_first_name: invitation.groom_first_name,
      bride_first_name: invitation.bride_first_name,
      family_name: invitation.family_name,
      wedding_date: invitation.wedding_date,
      wedding_time: invitation.wedding_time?.slice(0, 5) || "09:00",
      location: invitation.location,
      welcome_message: invitation.welcome_message,
      drink_limit: invitation.drink_limit,
    });
    setPhotoUrl(invitation.couple_photo_url);
  }, [invitation]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setBusy(true);
    const { error } = await supabase
      .from("invitations")
      .update({
        groom_first_name: form.groom_first_name.trim(),
        bride_first_name: form.bride_first_name.trim(),
        family_name: form.family_name.trim(),
        wedding_date: form.wedding_date,
        wedding_time: form.wedding_time,
        location: form.location.trim(),
        welcome_message: form.welcome_message.trim(),
        drink_limit: Math.max(1, Math.min(10, Number(form.drink_limit) || 2)),
      })
      .eq("id", invitation.id);
    setBusy(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    toast.success("Invitation mise à jour");
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Mon invitation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les informations visibles par tous vos invités.
        </p>
      </div>

      <form onSubmit={save} className="space-y-8">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-foreground">Photo du couple</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Elle apparaît en haut de l'invitation et dans les aperçus de partage.
          </p>
          <div className="mt-5">
            <PhotoUpload
              invitationId={invitation.id}
              photoUrl={photoUrl}
              onChange={(url) => {
                setPhotoUrl(url);
                refresh();
              }}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-foreground">Les mariés</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="groom">Prénom du marié</Label>
              <Input id="groom" required className="rounded-xl" value={form.groom_first_name} onChange={set("groom_first_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bride">Prénom de la mariée</Label>
              <Input id="bride" required className="rounded-xl" value={form.bride_first_name} onChange={set("bride_first_name")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="family">Nom de famille (optionnel)</Label>
              <Input id="family" className="rounded-xl" value={form.family_name} onChange={set("family_name")} placeholder="Ex. Familles Kasongo & Mbuyi" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-foreground">Le grand jour</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date du mariage</Label>
              <Input id="date" type="date" required className="rounded-xl" value={form.wedding_date} onChange={set("wedding_date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Heure de début</Label>
              <Input id="time" type="time" required className="rounded-xl" value={form.wedding_time} onChange={set("wedding_time")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="location">Lieu principal</Label>
              <Input id="location" className="rounded-xl" value={form.location} onChange={set("location")} placeholder="Ex. Salle des fêtes, Lubumbashi" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="welcome">Message d'accueil</Label>
              <Textarea
                id="welcome"
                rows={4}
                className="rounded-xl"
                value={form.welcome_message}
                onChange={set("welcome_message")}
                placeholder="Un mot chaleureux pour vos invités…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drink_limit">Boissons max. par invité</Label>
              <Input
                id="drink_limit"
                type="number"
                min={1}
                max={10}
                className="rounded-xl"
                value={form.drink_limit}
                onChange={set("drink_limit")}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy} className="rounded-full px-8 py-5 text-sm font-semibold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
