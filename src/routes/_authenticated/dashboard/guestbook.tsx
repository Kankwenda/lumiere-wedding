import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import type { GuestbookMessage } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard/guestbook")({
  component: GuestbookPage,
});

function GuestbookPage() {
  const { invitation, isLoading } = useInvitation();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["guestbook", invitation?.id],
    enabled: !!invitation?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guestbook_messages")
        .select("*, guests(full_name)")
        .eq("invitation_id", invitation!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GuestbookMessage[];
    },
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("guestbook_messages").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible", { description: error.message });
      return;
    }
    toast.success("Message supprimé");
    queryClient.invalidateQueries({ queryKey: ["guestbook", invitation?.id] });
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
        <h1 className="font-serif text-3xl font-semibold text-foreground">Livre d'or</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages.length} message{messages.length > 1 ? "s" : ""} laissé{messages.length > 1 ? "s" : ""} par vos invités.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-soft">
          <BookOpen className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
          <p className="mt-3 font-serif text-2xl text-foreground">Aucun message</p>
          <p className="mt-2 text-sm text-muted-foreground">Les mots doux de vos invités apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {messages.map((m) => (
            <blockquote key={m.id} className="relative rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className="text-sm italic leading-relaxed text-foreground">« {m.message} »</p>
              <footer className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary">— {m.guests?.full_name ?? "Invité"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => remove(m.id)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </footer>
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}
