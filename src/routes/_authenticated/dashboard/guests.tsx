import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import QRCode from "qrcode";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  Share2,
  Mail,
  QrCode,
  Download,
  Upload,
  ArrowUpDown,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import { generateGuestToken } from "@/lib/token";
import { buildShareMessage, coupleNames, whatsappNumber, whatsappUrl } from "@/lib/share";
import { RSVP_LABELS, type Guest, type RsvpStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const Route = createFileRoute("/_authenticated/dashboard/guests")({
  component: GuestsPage,
});

const CATEGORIES = ["Famille", "Amis", "Collègues", "VIP"];
const ALL = "__all__";

interface GuestForm {
  full_name: string;
  phone: string;
  email: string;
  party_size: number;
  category: string;
}

const EMPTY_FORM: GuestForm = { full_name: "", phone: "", email: "", party_size: 1, category: "Famille" };

function GuestsPage() {
  const { invitation, isLoading } = useInvitation();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [sortAsc, setSortAsc] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Guest | null>(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: guests = [] } = useQuery({
    queryKey: ["guests", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("invitation_id", invitation!.id)
        .order("full_name");
      if (error) throw error;
      return data as Guest[];
    },
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["guests", invitation?.id] });

  const inviteLink = (token: string) => `${window.location.origin}/invite/${token}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests
      .filter((g) => (q ? g.full_name.toLowerCase().includes(q) : true))
      .filter((g) => (statusFilter === ALL ? true : g.rsvp_status === statusFilter))
      .filter((g) => (categoryFilter === ALL ? true : g.category === categoryFilter))
      .sort((a, b) =>
        sortAsc
          ? a.full_name.localeCompare(b.full_name, "fr")
          : b.full_name.localeCompare(a.full_name, "fr"),
      );
  }, [guests, search, statusFilter, categoryFilter, sortAsc]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (g: Guest) => {
    setEditing(g);
    setForm({
      full_name: g.full_name,
      phone: g.phone ?? "",
      email: g.email ?? "",
      party_size: g.party_size,
      category: g.category,
    });
    setDialogOpen(true);
  };

  const saveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setBusy(true);
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      party_size: Math.max(1, Number(form.party_size) || 1),
      category: form.category,
    };
    if (!payload.full_name) {
      setBusy(false);
      return;
    }
    const { error } = editing
      ? await supabase.from("guests").update(payload).eq("id", editing.id)
      : await supabase
          .from("guests")
          .insert({ ...payload, invitation_id: invitation.id, token: generateGuestToken() });
    setBusy(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    toast.success(editing ? "Invité mis à jour" : "Invité ajouté");
    setDialogOpen(false);
    refresh();
  };

  const deleteGuest = async () => {
    if (!deleting) return;
    setBusy(true);
    const { error } = await supabase.from("guests").delete().eq("id", deleting.id);
    setBusy(false);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
      return;
    }
    toast.success("Invité supprimé");
    setDeleting(null);
    refresh();
  };

  const copyLink = async (g: Guest) => {
    await navigator.clipboard.writeText(inviteLink(g.token));
    toast.success(`Lien copié pour ${g.full_name}`);
  };

  const shareWhatsApp = (g: Guest) => {
    if (!invitation) return;
    const text = buildShareMessage(invitation, g.full_name, inviteLink(g.token));
    const number = whatsappNumber(g.phone, invitation.default_country_code ?? "");
    window.open(whatsappUrl(number, text), "_blank", "noopener");
  };

  const shareEmail = (g: Guest) => {
    if (!invitation) return;
    const subject = encodeURIComponent(`Invitation au mariage de ${coupleNames(invitation)}`);
    const body = encodeURIComponent(buildShareMessage(invitation, g.full_name, inviteLink(g.token)));
    window.location.href = `mailto:${g.email ?? ""}?subject=${subject}&body=${body}`;
  };

  const exportCsv = () => {
    const rows = guests.map((g) => ({
      full_name: g.full_name,
      phone: g.phone ?? "",
      email: g.email ?? "",
      party_size: g.party_size,
      category: g.category,
      rsvp_status: RSVP_LABELS[g.rsvp_status],
      lien: inviteLink(g.token),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invites.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const importCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !invitation) return;
    setImporting(true);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data
          .map((r) => ({
            full_name: (r["full_name"] ?? r["nom"] ?? r["name"] ?? "").trim(),
            phone: (r["phone"] ?? r["telephone"] ?? "").trim() || null,
            email: (r["email"] ?? "").trim() || null,
            party_size: Math.max(1, parseInt(r["party_size"] ?? r["personnes"] ?? "1", 10) || 1),
            category: CATEGORIES.includes(r["category"] ?? "") ? r["category"]! : "Famille",
          }))
          .filter((r) => r.full_name);
        if (rows.length === 0) {
          setImporting(false);
          toast.error("Aucune ligne valide", {
            description: "Le CSV doit contenir une colonne full_name (ou nom).",
          });
          return;
        }
        const { error } = await supabase.from("guests").insert(
          rows.map((r) => ({
            ...r,
            invitation_id: invitation.id,
            token: generateGuestToken(),
          })),
        );
        setImporting(false);
        if (error) {
          toast.error("Import impossible", { description: error.message });
          return;
        }
        toast.success(`${rows.length} invité${rows.length > 1 ? "s" : ""} importé${rows.length > 1 ? "s" : ""}`);
        refresh();
      },
      error: () => {
        setImporting(false);
        toast.error("Lecture du fichier impossible");
      },
    });
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
          <h1 className="font-serif text-3xl font-semibold text-foreground">Invités</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {guests.length} invité{guests.length > 1 ? "s" : ""} — chacun dispose d'un lien personnel unique.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={exportCsv} disabled={guests.length === 0}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" className="rounded-full" disabled={importing} onClick={() => fileRef.current?.click()}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importer CSV
          </Button>
          <Button className="rounded-full" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un invité…"
            className="rounded-full bg-card pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-full bg-card">
            <SelectValue placeholder="Statut RSVP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les statuts</SelectItem>
            {(Object.keys(RSVP_LABELS) as RsvpStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{RSVP_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 rounded-full bg-card">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes catégories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-serif text-2xl text-foreground">Aucun invité</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajoutez votre premier invité ou importez une liste CSV.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left">
                  <th className="px-5 py-3.5 font-semibold text-foreground">
                    <button className="inline-flex items-center gap-1.5" onClick={() => setSortAsc((v) => !v)}>
                      Nom <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-semibold text-foreground">Catégorie</th>
                  <th className="px-4 py-3.5 font-semibold text-foreground">Personnes</th>
                  <th className="px-4 py-3.5 font-semibold text-foreground">RSVP</th>
                  <th className="px-4 py-3.5 font-semibold text-foreground">Check-in</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{g.full_name}</p>
                      <p className="text-xs text-muted-foreground">{g.phone ?? g.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{g.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{g.party_size}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={g.rsvp_status === "declined" ? "destructive" : g.rsvp_status === "attending" ? "default" : "secondary"}
                        className="rounded-full"
                      >
                        {RSVP_LABELS[g.rsvp_status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {g.checked_in_at ? (
                        <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                          Arrivé
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Copier le lien" onClick={() => copyLink(g)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button title="Partager via WhatsApp" onClick={() => shareWhatsApp(g)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button title="Partager par email" onClick={() => shareEmail(g)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                          <Mail className="h-4 w-4" />
                        </button>
                        <GuestQr name={g.full_name} url={inviteLink(g.token)} />
                        <button title="Modifier" onClick={() => openEdit(g)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button title="Supprimer" onClick={() => setDeleting(g)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ajout / édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editing ? "Modifier l'invité" : "Nouvel invité"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveGuest} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="g-name">Nom complet</Label>
              <Input id="g-name" required className="rounded-xl" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="g-phone">Téléphone</Label>
                <Input id="g-phone" className="rounded-xl" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-email">Email</Label>
                <Input id="g-email" type="email" className="rounded-xl" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-size">Nombre de personnes</Label>
                <Input id="g-size" type="number" min={1} max={20} className="rounded-xl" value={form.party_size} onChange={(e) => setForm((f) => ({ ...f, party_size: parseInt(e.target.value, 10) || 1 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={busy} className="rounded-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suppression */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleting?.full_name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Son lien d'invitation cessera de fonctionner et ses réponses seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteGuest}
              disabled={busy}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GuestQr({ name, url }: { name: string; url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  return (
    <Popover
      onOpenChange={async (open) => {
        if (open && !src) {
          setSrc(await QRCode.toDataURL(url, { width: 320, margin: 1 }));
        }
      }}
    >
      <PopoverTrigger asChild>
        <button title="QR code" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <QrCode className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 rounded-2xl p-4 text-center">
        {src ? (
          <img src={src} alt={`QR code de ${name}`} className="mx-auto w-full rounded-lg" />
        ) : (
          <div className="mx-auto h-40 w-40 animate-pulse rounded-lg bg-secondary" />
        )}
        <p className="mt-2 text-xs font-medium text-foreground">{name}</p>
        <p className="text-[10px] text-muted-foreground">
          <Share2 className="mr-1 inline h-3 w-3" />
          À présenter à l'entrée
        </p>
      </PopoverContent>
    </Popover>
  );
}
