import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { HeartCrack } from "lucide-react";
import { getInvitationByToken } from "@/lib/invite.functions";
import { InvitationView } from "@/components/invitation/InvitationView";
import type { PublicInvitationData } from "@/lib/types";

const inviteQuery = (token: string) =>
  queryOptions({
    queryKey: ["invite", token],
    queryFn: () => getInvitationByToken({ data: { token } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/invite/$token")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(inviteQuery(params.token)),
  head: ({ loaderData }) => {
    const data = loaderData as PublicInvitationData | null;
    if (!data) {
      return {
        meta: [
          { title: "Invitation introuvable — LUMIÈRE WEDDING" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const names = `${data.invitation.groom_first_name} & ${data.invitation.bride_first_name}`;
    const title = `Mariage de ${names} — ${data.invitation.wedding_date}`;
    const description = `${data.guest.full_name}, vous êtes invité(e) au mariage de ${names}. ${data.invitation.welcome_message}`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: `Mariage de ${names}` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (data.invitation.couple_photo_url?.startsWith("http")) {
      meta.push(
        { property: "og:image", content: data.invitation.couple_photo_url },
        { name: "twitter:image", content: data.invitation.couple_photo_url },
      );
    }
    return { meta };
  },
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { data } = useSuspenseQuery(inviteQuery(token));

  if (!data) {
    return (
      <div className="gradient-lavender flex min-h-screen items-center justify-center px-6">
        <div className="glass animate-fade-up max-w-md rounded-3xl p-10 text-center shadow-soft">
          <HeartCrack className="mx-auto h-10 w-10 text-primary" strokeWidth={1.4} />
          <h1 className="mt-5 font-serif text-3xl font-medium text-foreground">
            Invitation introuvable
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Cette invitation n'existe pas ou n'est plus disponible. Vérifiez le
            lien que vous avez reçu.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Découvrir LUMIÈRE WEDDING
          </Link>
        </div>
      </div>
    );
  }

  return <InvitationView data={data} token={token} />;
}
