import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Circle, Search, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import type { Guest } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/checkin")({
  component: CheckinPage,
});

const REGION_ID = "qr-reader-region";

type ScanResult =
  | { kind: "ok"; guest: Guest }
  | { kind: "already"; guest: Guest }
  | { kind: "warn"; guest: Guest }
  | { kind: "unknown" };

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** Extrait le token d'un QR (lien /invite/<token> ou token brut). */
function tokenFromScan(text: string): string {
  const m = text.match(/\/invite\/([A-Za-z0-9_-]+)/);
  return (m ? m[1]! : text.trim()).slice(0, 64);
}

function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let scanner: { stop: () => Promise<void>; clear: () => void; isScanning?: boolean } | null = null;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(REGION_ID);
        scanner = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => onScanRef.current(text),
          () => {},
        );
      } catch {
        if (!cancelled) {
          setError("Caméra inaccessible. Autorisez l'accès à la caméra dans votre navigateur.");
          setActive(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      const s = scanner;
      if (s) s.stop().then(() => s.clear()).catch(() => {});
    };
  }, [active]);

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Scanner un QR code</h2>
          <p className="text-xs text-muted-foreground">
            Pointez la caméra vers le QR code de l'invité : son arrivée est enregistrée.
          </p>
        </div>
        <Button
          type="button"
          variant={active ? "outline" : "default"}
          className="rounded-full"
          onClick={() => {
            setError(null);
            setActive((v) => !v);
          }}
        >
          {active ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {active ? "Arrêter" : "Activer la caméra"}
        </Button>
      </div>
      {error && (
        <p className="mt-3 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
      <div
        id={REGION_ID}
        className={cn("mx-auto mt-4 w-full max-w-sm overflow-hidden rounded-2xl", !active && "hidden")}
      />
    </div>
  );
}

function CheckinPage() {
  const { invitation, isLoading } = useInvitation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

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

  const guestsRef = useRef<Guest[]>(guests);
  guestsRef.current = guests;
  const lastScan = useRef<{ token: string; at: number } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((g) => g.full_name.toLowerCase().includes(q));
  }, [guests, search]);

  const stats = useMemo(() => {
    const arrived = guests.filter((g) => g.checked_in_at);
    return {
      total: guests.length,
      checkedIn: arrived.length,
      people: arrived.reduce((s, g) => s + g.party_size, 0),
      expected: guests
        .filter((g) => g.rsvp_status !== "declined")
        .reduce((s, g) => s + g.party_size, 0),
    };
  }, [guests]);

  const setCheckin = useCallback(
    async (guest: Guest, value: boolean) => {
      const { error } = await supabase
        .from("guests")
        .update({ checked_in_at: value ? new Date().toISOString() : null })
        .eq("id", guest.id);
      if (error) {
        toast.error("Mise à jour impossible", { description: error.message });
        return false;
      }
      queryClient.invalidateQueries({ queryKey: ["guests", invitation?.id] });
      return true;
    },
    [queryClient, invitation?.id],
  );

  const handleScan = useCallback(
    async (text: string) => {
      const token = tokenFromScan(text);
      const now = Date.now();
      if (lastScan.current && lastScan.current.token === token && now - lastScan.current.at < 4000) return;
      lastScan.current = { token, at: now };

      const guest = guestsRef.current.find((g) => g.token === token);
      if (!guest) {
        setResult({ kind: "unknown" });
        return;
      }
      if (guest.checked_in_at) {
        setResult({ kind: "already", guest });
        return;
      }
      if (await setCheckin(guest, true)) {
        setResult(guest.rsvp_status === "declined" ? { kind: "warn", guest } : { kind: "ok", guest });
      }
    },
    [setCheckin],
  );

  const toggle = async (guest: Guest) => {
    const next = !guest.checked_in_at;
    if (await setCheckin(guest, next)) {
      toast.success(next ? `${guest.full_name} enregistré(e)` : `${guest.full_name} désenregistré(e)`);
    }
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
          <h1 className="font-serif text-3xl font-semibold text-foreground">Check-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enregistrez l'arrivée de vos invités le jour J.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            {stats.checkedIn} / {stats.total} invités
          </Badge>
          <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm">
            {stats.people} / {stats.expected} personnes
          </Badge>
        </div>
      </div>

      <QrScanner onScan={handleScan} />

      {result && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4",
            result.kind === "ok" && "border-primary/40 bg-primary/10",
            (result.kind === "already" || result.kind === "warn") && "border-amber-400/50 bg-amber-50 dark:bg-amber-950/30",
            result.kind === "unknown" && "border-destructive/40 bg-destructive/10",
          )}
        >
          {result.kind === "ok" && <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />}
          {(result.kind === "already" || result.kind === "warn") && <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />}
          {result.kind === "unknown" && <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-destructive" />}
          <div className="min-w-0 text-sm">
            {result.kind === "unknown" ? (
              <>
                <p className="font-semibold text-foreground">QR code inconnu</p>
                <p className="text-muted-foreground">Cette invitation n'appartient pas à votre mariage.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">
                  {result.guest.full_name} · {result.guest.party_size} personne{result.guest.party_size > 1 ? "s" : ""}
                </p>
                <p className="text-muted-foreground">
                  {result.kind === "ok" && "Arrivée enregistrée. Bienvenue !"}
                  {result.kind === "warn" && "Arrivée enregistrée, mais cet invité avait répondu « indisponible »."}
                  {result.kind === "already" &&
                    `Déjà enregistré(e) à ${result.guest.checked_in_at ? time(result.guest.checked_in_at) : "—"}.`}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="rounded-full bg-card pl-10"
          placeholder="Ou rechercher un invité par son nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-soft">
            <p className="font-serif text-2xl text-foreground">Aucun invité trouvé</p>
          </div>
        )}
        {filtered.map((g) => (
          <button
            key={g.id}
            onClick={() => toggle(g)}
            className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-all hover:shadow-elegant"
          >
            {g.checked_in_at ? (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
            ) : (
              <Circle className="h-6 w-6 shrink-0 text-muted-foreground/40" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{g.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {g.party_size} personne{g.party_size > 1 ? "s" : ""}
                {g.checked_in_at && ` · Arrivé à ${time(g.checked_in_at)}`}
              </p>
            </div>
            {g.checked_in_at && <Badge className="rounded-full">Présent</Badge>}
          </button>
        ))}
      </div>
    </div>
  );
}
