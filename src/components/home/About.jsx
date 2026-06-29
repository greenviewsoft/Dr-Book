import { Award, Users, Star, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Reveal } from "@/components/common/Reveal";
import { CountUp } from "@/components/common/CountUp";

const STATS = [
  { key: "stat1", Icon: Award },
  { key: "stat2", Icon: Users },
  { key: "stat3", Icon: Star },
];

export function About({ config }) {
  const { t, lang } = useI18n();
  return (
    <section id="about" className="scroll-mt-24 bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2">
        {/* Doctor visual */}
        <Reveal className="relative mx-auto w-full max-w-sm lg:order-first">
          <div className="bg-primary/10 absolute inset-0 rotate-3 rounded-[2rem]" />
          <img
            src={config?.photo || "/doctor.svg"}
            alt={config?.name || t("app.name")}
            className="bg-card relative w-full rounded-[2rem] border border-border/60 shadow-lg"
          />
          <div className="bg-background absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 shadow-md sm:-left-6">
            <span className="bg-success/15 text-success flex size-9 items-center justify-center rounded-full">
              <ShieldCheck className="size-5" />
            </span>
            <p className="text-xs leading-tight font-semibold">
              {t("home.footer.tagline")}
            </p>
          </div>
        </Reveal>

        {/* Bio + stats */}
        <Reveal delay={120}>
          <p className="text-primary text-sm font-semibold">
            {t("home.nav.about")}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("home.about.title")}
          </h2>
          {config?.name && (
            <p className="mt-1 text-lg font-semibold">
              {config.name}
              {config.specialty ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {config.specialty}
                </span>
              ) : null}
            </p>
          )}
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:text-base">
            {t("home.about.body")}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div
                key={s.key}
                className="bg-muted/50 rounded-xl p-4 text-center"
              >
                <s.Icon className="text-primary mx-auto mb-1 size-5" />
                <div className="text-xl font-bold sm:text-2xl">
                  <CountUp key={lang} value={t(`home.about.${s.key}.value`)} />
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {t(`home.about.${s.key}.label`)}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
