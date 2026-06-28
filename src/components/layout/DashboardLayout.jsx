import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, Settings, CalendarOff, LogOut, ExternalLink } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/features/admin/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", end: true, icon: CalendarDays, key: "admin.nav.dashboard" },
  { to: "/admin/settings", end: false, icon: Settings, key: "admin.nav.settings" },
  { to: "/admin/holidays", end: false, icon: CalendarOff, key: "admin.nav.holidays" },
];

export function DashboardLayout() {
  const { t } = useI18n();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <span className="font-semibold">{t("app.name")}</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-muted-foreground text-sm">
            {t("admin.nav.dashboard")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                <span className="hidden sm:inline">{t("admin.viewSite")}</span>
              </a>
            </Button>
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("admin.nav.logout")}</span>
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-3 pb-2">
          {navItems.map(({ to, end, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <Icon className="size-4" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
