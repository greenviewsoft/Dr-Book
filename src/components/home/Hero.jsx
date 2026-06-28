import { useEffect, useState } from "react";
import {
  CalendarPlus,
  ArrowRight,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const SLIDES = [
  { key: "slide1", Icon: CalendarPlus },
  { key: "slide2", Icon: HeartPulse },
  { key: "slide3", Icon: ShieldCheck },
];

export function Hero({ config }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[i];
  const doctorLabel = config?.name
    ? `${config.name}${config.specialty ? ` · ${config.specialty}` : ""}`
    : t("app.tagline");

  return (
    <section className="bg-hero-medical relative overflow-hidden text-white">
      <div className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2">
        {/* Left: rotating feature slider */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Stethoscope className="size-3.5" />
            {doctorLabel}
          </div>

          <div className="mt-5 min-h-[168px]">
            <div key={i} className="animate-fade-in-up">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <slide.Icon className="size-6 text-white" />
              </div>
              <h1 className="text-balance text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t(`home.hero.${slide.key}.title`)}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
                {t(`home.hero.${slide.key}.desc`)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#book"
              className={cn(buttonVariants({ size: "lg" }), "shadow-sm")}
            >
              <CalendarPlus className="size-4" /> {t("home.hero.cta")}
            </a>
            <a
              href="#about"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
              )}
            >
              {t("home.nav.learnMore")} <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="mt-7 flex items-center gap-2">
            {SLIDES.map((s, idx) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === i
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </div>

        {/* Right: doctor illustration */}
        <div className="relative mx-auto hidden max-w-sm lg:block">
          <div className="absolute inset-0 scale-95 rounded-[2.5rem] bg-white/10 blur-2xl" />
          <img
            src={config?.photo || "/doctor.svg"}
            alt={config?.name || t("app.name")}
            className="relative w-full rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
