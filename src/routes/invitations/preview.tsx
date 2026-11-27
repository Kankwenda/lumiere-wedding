import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { InvitationView } from "@/components/invitation/InvitationView";
import { INVITATION_THEMES } from "@/lib/templates";
import { getSampleInvitation } from "@/lib/sample-invitation";
import type { TemplateId } from "@/lib/types";

const searchSchema = z.object({
  template: z.enum(["elegance", "lavender", "royal", "minimal"]).optional(),
});

export const Route = createFileRoute("/invitations/preview")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Modèles d'invitation — LUMIÈRE WEDDING" },
      {
        name: "description",
        content:
          "Parcourez les modèles d'invitation LUMIÈRE : programme, RSVP, boissons, livre d'or et QR code.",
      },
    ],
  }),
  component: PreviewPage,
});

function PreviewPage() {
  const { template = "elegance" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const data = useMemo(() => getSampleInvitation(), []);

  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Exemple d'invitation — aucune donnée n'est enregistrée
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {Object.values(INVITATION_THEMES).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate({ search: { template: t.id as TemplateId }, replace: true })}
              className={
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors " +
                (template === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground")
              }
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <InvitationView data={data} token="exemple" interactive={false} templateOverride={template} />
    </div>
  );
}
