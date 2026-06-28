import { Stethoscope, Phone, Clock, CalendarDays } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { formatTime } from "@/lib/datetime";

const LINKS = [
  { href: "#about", key: "home.nav.about" },
  { href: "#expertise", key: "home.nav.expertise" },
  { href: "#book", key: "home.nav.book" },
];

export function SiteFooter({ config }) {
  const { t, lang } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="scroll-mt-24 border-t bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl">
              <Stethoscope className="size-5" />
            </span>
            <span className="font-semibold">
              {config?.chamber_name || t("app.name")}
            </span>
          </div>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm">
            {t("home.footer.tagline")}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">{t("home.nav.expertise")}</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-muted-foreground hover:text-primary"
                >
                  {t(l.key)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">{t("home.footer.contactTitle")}</h4>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            {config?.daily_start && config?.daily_end && (
              <li className="flex items-center gap-2">
                <Clock className="size-4 shrink-0" />
                {formatTime(config.daily_start, lang)} –{" "}
                {formatTime(config.daily_end, lang)}
              </li>
            )}
            {config?.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" /> {config.phone}
              </li>
            )}
            {config?.working_days?.length > 0 && (
              <li className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0" />
                {(config.working_days || [])
                  .map((d) => t(`days.${d}`))
                  .join(", ")}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto max-w-6xl px-4 py-4 text-center text-xs">
          © {year} {config?.chamber_name || t("app.name")}.{" "}
          {t("home.footer.rights")}
        </div>
      </div>
    </footer>
  );
}
