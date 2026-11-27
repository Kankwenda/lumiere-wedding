import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import { RSVP_LABELS, type Guest, type GuestbookMessage, type RsvpStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

const STATUS_COLORS: Record<RsvpStatus, string> = {
  attending: "oklch(0.62 0.16 300)",
  declined: "oklch(0.65 0.22 25)",
  pending: "oklch(0.75 0.12 85)",
};

type ChecklistTo = "/dashboard/invitation" | "/dashboard/guests" | "/dashboard/settings";

function Checklist({ steps }: { steps: { done: boolean; label: string; to: ChecklistTo }[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold text-foreground">Pour bien démarrer</h2>
        <span className="text-xs font-semibold text-primary">{done} / {steps.length}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/10">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-primary/10">
              <CheckCircle2 className={s.done ? "h-4.5 w-4.5 text-primary" : "h-4.5 w-4.5 text-muted-foreground/40"} />
              <span className={s.done ? "text-muted-foreground line-through" : "font-medium text-foreground"}>{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardHome() {
  const { invitation, isLoading } = useInvitation();

  const { data: guests = [] } = useQuery({
    queryKey: ["dash-guests", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("invitation_id", invitation!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Guest[];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["dash-guestbook", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guestbook_messages")
        .select("*, guests(full_name)")
        .eq("invitation_id", invitation!.id)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as GuestbookMessage[];
    },
  });

  const stats = useMemo(() => {
    const attending = guests.filter((g) => g.rsvp_status === "attending").length;
    const declined = guests.filter((g) => g.rsvp_status === "declined").length;
    const pending = guests.filter((g) => g.rsvp_status === "pending").length;
    const checkedIn = guests.filter((g) => g.checked_in_at).length;
    const seats = guests
      .filter((g) => g.rsvp_status === "attending")
      .reduce((s, g) => s + g.party_size, 0);
    return { total: guests.length, attending, declined, pending, checkedIn, seats };
  }, [guests]);

  const chartData = useMemo(
    () =>
      ([
        { name: RSVP_LABELS.attending, value: stats.attending, status: "attending" },
        { name: RSVP_LABELS.declined, value: stats.declined, status: "declined" },
        { name: RSVP_LABELS.pending, value: stats.pending, status: "pending" },
      ] as const).filter((d) => d.value > 0),
    [stats],
  );

  const recentResponses = useMemo(
    () =>
      guests
        .filter((g) => g.rsvp_at)
        .sort((a, b) => (b.rsvp_at ?? "").localeCompare(a.rsvp_at ?? ""))
        .slice(0, 6),
    [guests],
  );

  if (isLoading || !invitation) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const CARDS = [
    { label: "Invités", value: stats.total, icon: Users, tint: "bg-primary/10 text-primary" },
    { label: "Présents", value: stats.attending, icon: CheckCircle2, tint: "bg-primary/10 text-primary" },
    { label: "Indisponibles", value: stats.declined, icon: XCircle, tint: "bg-destructive/10 text-destructive" },
    { label: "En attente", value: stats.pending, icon: Clock, tint: "bg-gold/15 text-gold-deep" },
    { label: "Enregistrés (check-in)", value: stats.checkedIn, icon: ScanLine, tint: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          {invitation.groom_first_name || invitation.bride_first_name
            ? [invitation.groom_first_name, invitation.bride_first_name].filter(Boolean).join(" & ")
            : "Votre mariage"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d'ensemble de votre mariage — {stats.seats} place{stats.seats > 1 ? "s" : ""} confirmée{stats.seats > 1 ? "s" : ""}
        </p>
      </div>

      <Checklist
        steps={[
          { done: Boolean(invitation.groom_first_name && invitation.bride_first_name), label: "Renseigner le prénom des mariés", to: "/dashboard/invitation" },
          { done: Boolean(invitation.couple_photo_url), label: "Ajouter une photo du couple", to: "/dashboard/invitation" },
          { done: Boolean(invitation.location), label: "Indiquer le lieu et personnaliser le message d'accueil", to: "/dashboard/invitation" },
          { done: guests.length > 0, label: "Ajouter vos invités", to: "/dashboard/guests" },
          { done: Boolean(invitation.telegram_chat_id), label: "Activer les notifications Telegram", to: "/dashboard/settings" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-4.5 w-4.5" strokeWidth={1.7} />
            </span>
            <p className="mt-3 font-serif text-3xl font-semibold text-foreground">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-serif text-xl font-semibold text-foreground">Réponses RSVP</h2>
          {chartData.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Aucune réponse pour le moment. Partagez vos liens d'invitation pour recevoir les confirmations.
            </p>
          ) : (
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData as unknown as Record<string, unknown>[]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {chartData.map((d) => (
                      <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-foreground">Dernières réponses</h2>
            <Link
              to="/dashboard/guests"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentResponses.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune réponse enregistrée.</p>
            )}
            {recentResponses.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{g.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.rsvp_at ? new Date(g.rsvp_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
                <Badge
                  variant={g.rsvp_status === "declined" ? "destructive" : g.rsvp_status === "attending" ? "default" : "secondary"}
                  className="rounded-full"
                >
                  {RSVP_LABELS[g.rsvp_status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-foreground">Livre d'or</h2>
          <Link
            to="/dashboard/guestbook"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Tout voir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
          )}
          {messages.map((m) => (
            <blockquote key={m.id} className="rounded-2xl bg-secondary/60 p-4">
              <p className="text-sm italic leading-relaxed text-foreground">« {m.message} »</p>
              <footer className="mt-2 text-xs font-semibold text-primary">
                — {m.guests?.full_name ?? "Invité"}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}
