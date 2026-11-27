import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  LayoutDashboard,
  HeartHandshake,
  Palette,
  Users,
  CalendarClock,
  Shirt,
  Wine,
  BookOpen,
  ScanLine,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/invitation", label: "Mon invitation", icon: HeartHandshake },
  { to: "/dashboard/design", label: "Design", icon: Palette },
  { to: "/dashboard/guests", label: "Invités", icon: Users },
  { to: "/dashboard/program", label: "Programme", icon: CalendarClock },
  { to: "/dashboard/dresscode", label: "Dress code", icon: Shirt },
  { to: "/dashboard/preferences", label: "Préférences", icon: Wine },
  { to: "/dashboard/guestbook", label: "Livre d'or", icon: BookOpen },
  { to: "/dashboard/checkin", label: "Check-in", icon: ScanLine },
  { to: "/dashboard/settings", label: "Paramètres", icon: Settings },
] as const;

function DashboardLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-6 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="font-serif text-lg font-semibold text-foreground">
            LUMIÈRE WEDDING
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: "exact" in rest }}
              activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-accent hover:text-foreground",
              }}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.7} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={1.7} />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Barre mobile */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-2.5 px-4 pt-3.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
            <span className="font-serif text-base font-semibold text-foreground">
              LUMIÈRE WEDDING
            </span>
            <button
              onClick={handleSignOut}
              className="ml-auto rounded-full p-2 text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4.5 w-4.5" strokeWidth={1.7} />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map(({ to, label, ...rest }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: "exact" in rest }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                inactiveProps={{ className: "bg-secondary text-muted-foreground" }}
                className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
