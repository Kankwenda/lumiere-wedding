import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, QrCode, Sparkles, Users, Wine, BookOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUMIÈRE WEDDING — Invitations de mariage numériques" },
      {
        name: "description",
        content:
          "Créez, personnalisez et partagez des invitations de mariage numériques élégantes : RSVP en ligne, QR codes invités, livre d'or et check-in le jour J.",
      },
      { property: "og:title", content: "LUMIÈRE WEDDING — Invitations de mariage numériques" },
      {
        property: "og:description",
        content:
          "Invitations de mariage numériques élégantes : RSVP en ligne, QR codes invités, livre d'or et check-in le jour J.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "RSVP en un clic",
    text: "Chaque invité confirme sa présence depuis son invitation personnelle — plus de relances.",
  },
  {
    icon: Wine,
    title: "Préférences de boissons",
    text: "Anticipez vos achats grâce aux choix de chaque invité, en temps réel.",
  },
  {
    icon: QrCode,
    title: "QR code personnel",
    text: "Chaque lien est unique. Scannez les QR codes à l'entrée pour enregistrer les arrivées.",
  },
  {
    icon: BookOpen,
    title: "Livre d'or vivant",
    text: "Des mots doux collectés avant le grand jour, à relire pour toujours.",
  },
  {
    icon: Users,
    title: "Gestion des invités",
    text: "Import CSV, catégories, partage WhatsApp personnalisé, comptage des sièges confirmés.",
  },
  {
    icon: Sparkles,
    title: "Thèmes sur mesure",
    text: "Quatre modèles élégants ; couleurs, polices et boutons personnalisables avec aperçu en direct.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-serif text-xl font-semibold tracking-wide text-foreground">
          LUMIÈRE <span className="text-primary">WEDDING</span>
        </p>
        <nav className="flex items-center gap-3">
          <Link
            to="/auth"
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Se connecter
          </Link>
          <Link
            to="/auth"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-elegant"
          >
            Créer mon invitation
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center md:pt-24">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          L'invitation qui fait rêver
        </p>
        <h1 className="mt-6 font-serif text-5xl font-semibold leading-[1.08] text-foreground md:text-7xl">
          Votre mariage,
          <br />
          <em className="text-primary">sublimé dès l'invitation</em>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Créez en quelques minutes une invitation numérique d'exception : programme, RSVP,
          boissons, livre d'or et check-in le jour J — réunis dans une expérience inoubliable.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02]"
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/invitations/preview"
            className="rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voir les modèles
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground md:text-4xl">
            Tout pour un jour J sans stress
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Une plateforme pensée pour les couples exigeants et leurs invités.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="font-serif text-4xl font-semibold leading-tight text-foreground md:text-5xl">
          Prêt·e à illuminer
          <br />
          votre plus beau jour ?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Rejoignez les couples qui ont choisi LUMIÈRE WEDDING pour annoncer leur union.
        </p>
        <Link
          to="/auth"
          className="group mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02]"
        >
          Créer mon invitation
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LUMIÈRE WEDDING — Des invitations aussi uniques que votre histoire.
      </footer>
    </div>
  );
}
