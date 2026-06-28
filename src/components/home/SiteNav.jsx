import { useState } from "react";
import { Stethoscope, Menu, XIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const LINKS = [
  { href: "#about", key: "home.nav.about" },
  { href: "#expertise", key: "home.nav.expertise" },
  { href: "#contact", key: "home.nav.contact" },
];

export function SiteNav({ config }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
            <Stethoscope className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">
              {config?.chamber_name || t("app.name")}
            </span>
            <span className="text-muted-foreground text-xs">
              {config?.specialty || t("app.tagline")}
            </span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:bg-accent hover:text-primary rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                {t(l.key)}
              </a>
            ))}
          </nav>

          <LanguageToggle />

          <a
            href="#book"
            className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
          >
            {t("home.nav.book")}
          </a>

          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-md md:hidden"
          >
            {open ? <XIcon className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium"
              >
                {t(l.key)}
              </a>
            ))}
            <a
              href="#book"
              onClick={() => setOpen(false)}
              className="bg-primary text-primary-foreground mt-1 rounded-md px-3 py-2 text-center text-sm font-medium"
            >
              {t("home.nav.book")}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
