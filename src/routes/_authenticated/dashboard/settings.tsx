import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BellRing, CheckCircle2, Loader2, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvitation } from "@/hooks/use-invitation";
import { getTelegramStatus, sendTestTelegram } from "@/lib/settings.functions";
import { buildShareMessage, DEFAULT_SHARE_MESSAGE, SHARE_PLACEHOLDERS } from "@/lib/share";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — LUMIÈRE WEDDING" },
      { name: "description", content: "Notifications Telegram, message de partage et réglages." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

function SettingsPage() {
  const { invitation, refresh } = useInvitation();
  const fetchStatus = useServerFn(getTelegramStatus);
  const runTest = useServerFn(sendTestTelegram);

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["telegram-status"],
    queryFn: () => fetchStatus(),
  });

  const [chatId, setChatId] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [savingTg, setSavingTg] = useState(false);
  const [savingShare, setSavingShare] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!invitation) return;
    setChatId(invitation.telegram_chat_id ?? "");
    setShareMessage(invitation.share_message ?? "");
    setCountryCode(invitation.default_country_code ?? "");
  }, [invitation]);

  const saveTelegram = async () => {
    if (!invitation || savingTg) return;
    const value = chatId.trim();
    if (value && !/^-?\d{5,20}$/.test(value)) {
      toast.error("Identifiant invalide", { description: "Le Chat ID est un nombre (ex. 123456789)." });
      return;
    }
    setSavingTg(true);
    const { error } = await supabase
      .from("invitations")
      .update({ telegram_chat_id: value || null })
      .eq("id", invitation.id);
    setSavingTg(false);
    if (error) {
      toast.error("Impossible d'enregistrer l'identifiant.");
      return;
    }
    await Promise.all([refresh(), refetchStatus()]);
    toast.success("Identifiant Telegram enregistré.");
  };

  const test = async () => {
    if (testing) return;
    setTesting(true);
    try {
      await runTest();
      toast.success("Message de test envoyé sur votre Telegram !");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi du test.");
    } finally {
      setTesting(false);
    }
  };

  const saveShare = async () => {
    if (!invitation || savingShare) return;
    setSavingShare(true);
    const { error } = await supabase
      .from("invitations")
      .update({
        share_message: shareMessage.trim(),
        default_country_code: countryCode.replace(/\D/g, ""),
      })
      .eq("id", invitation.id);
    setSavingShare(false);
    if (error) {
      toast.error("Enregistrement impossible", { description: error.message });
      return;
    }
    await refresh();
    toast.success("Message de partage enregistré.");
  };

  const insertToken = (token: string) => setShareMessage((m) => `${m}${m && !m.endsWith(" ") ? " " : ""}${token}`);

  const preview = invitation
    ? buildShareMessage({ ...invitation, share_message: shareMessage }, "Marie", `${typeof window !== "undefined" ? window.location.origin : ""}/invite/AbC123xYz9`)
    : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">Notifications et envoi des invitations.</p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquareText className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Message d'invitation</h2>
            <p className="text-xs text-muted-foreground">
              Utilisé pour le partage WhatsApp et email depuis la page Invités.
            </p>
          </div>
        </div>

        <label className="mt-5 block text-sm font-medium text-foreground" htmlFor="share-msg">
          Votre message (laisser vide pour le message par défaut)
        </label>
        <textarea
          id="share-msg"
          rows={5}
          value={shareMessage}
          onChange={(e) => setShareMessage(e.target.value)}
          placeholder={DEFAULT_SHARE_MESSAGE}
          className={`${inputCls} mt-2 leading-relaxed`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Insérer :</span>
          {SHARE_PLACEHOLDERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => insertToken(t)}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent"
            >
              {t}
            </button>
          ))}
        </div>

        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Aperçu :</strong> {preview}
        </p>

        <label className="mt-5 block text-sm font-medium text-foreground" htmlFor="cc">
          Indicatif pays par défaut (facultatif)
        </label>
        <input
          id="cc"
          inputMode="numeric"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          placeholder="Ex. 243 pour la RDC, 33 pour la France"
          className={`${inputCls} mt-2`}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Permet d'ouvrir WhatsApp directement sur les numéros locaux commençant par 0.
        </p>

        <button type="button" onClick={saveShare} disabled={savingShare || !invitation} className={`${primaryBtn} mt-5`}>
          {savingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Enregistrer
        </button>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellRing className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Notifications Telegram</h2>
            <p className="text-xs text-muted-foreground">
              Recevez chaque RSVP, choix de boisson et message du livre d'or.
            </p>
          </div>
        </div>

        {status && !status.botConfigured && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-foreground" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <span>
              Le bot Telegram n'est pas encore configuré sur le serveur : aucune notification ne peut
              partir. Ajoutez la variable d'environnement <code>TELEGRAM_BOT_TOKEN</code> (voir le README).
            </span>
          </div>
        )}

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            Ouvrez Telegram
            {status?.botUsername ? (
              <>
                {" "}
                et envoyez <strong className="text-foreground">/start</strong> à{" "}
                <a
                  className="font-semibold text-primary underline underline-offset-4"
                  href={`https://t.me/${status.botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{status.botUsername}
                </a>
                .
              </>
            ) : (
              <> et envoyez <strong className="text-foreground">/start</strong> au bot de la plateforme.</>
            )}
          </li>
          <li>Écrivez ensuite à <strong className="text-foreground">@userinfobot</strong> : il vous répond avec votre <strong className="text-foreground">Chat ID</strong>.</li>
          <li>Collez ce numéro ci-dessous, enregistrez, puis envoyez un test.</li>
        </ol>

        <label className="mt-6 block text-sm font-medium text-foreground" htmlFor="chat-id">
          Identifiant de discussion (Chat ID)
        </label>
        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
          <input
            id="chat-id"
            type="text"
            inputMode="numeric"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Ex. 123456789"
            className={`${inputCls} flex-1`}
          />
          <button type="button" onClick={saveTelegram} disabled={savingTg || !invitation} className={primaryBtn}>
            {savingTg ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>

        <button
          type="button"
          onClick={test}
          disabled={testing || !status?.botConfigured || !invitation?.telegram_chat_id || chatId.trim() !== (invitation?.telegram_chat_id ?? "")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Envoyer un message de test
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Le test envoie un vrai message sur votre Telegram (l'identifiant doit d'abord être enregistré).
        </p>
      </section>
    </div>
  );
}
