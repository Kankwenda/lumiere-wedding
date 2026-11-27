import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Connexion — LUMIÈRE WEDDING" },
      { name: "description", content: "Accédez à votre espace mariés LUMIÈRE WEDDING." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setBusy(false);
    if (error) {
      toast.error("Connexion impossible", { description: error.message });
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Inscription impossible", { description: error.message });
      return;
    }
    setSignupEmailSent(true);
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Connexion Google impossible", { description: String(result.error) });
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="gradient-lavender flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l'accueil
      </Link>

      <div className="glass w-full max-w-md animate-fade-up rounded-3xl p-8 shadow-soft sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-foreground">
            LUMIÈRE WEDDING
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            L'espace privé de votre mariage
          </p>
        </div>

        {signupEmailSent ? (
          <div className="mt-8 animate-fade-in rounded-2xl bg-secondary p-6 text-center">
            <Mail className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
            <h2 className="mt-3 font-medium text-foreground">Vérifiez votre boîte mail</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Un lien de confirmation a été envoyé à <strong>{signupEmail}</strong>.
              Cliquez dessus pour activer votre compte, puis connectez-vous.
            </p>
            <Button
              variant="outline"
              className="mt-5 rounded-full"
              onClick={() => setSignupEmailSent(false)}
            >
              Retour
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="login" className="rounded-full">Connexion</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      className="rounded-xl pl-10"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="rounded-xl pl-10"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full py-5 text-sm font-semibold"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Votre nom</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Ex. Mbuyi Kasongo"
                      className="rounded-xl pl-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      className="rounded-xl pl-10"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="6 caractères minimum"
                      className="rounded-xl pl-10"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full py-5 text-sm font-semibold"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer mon compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        {!signupEmailSent && (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">ou</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogle}
              className="w-full rounded-full py-5 text-sm font-medium"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                />
              </svg>
              Continuer avec Google
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
