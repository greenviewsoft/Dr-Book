import {
  Stethoscope,
  HeartPulse,
  Activity,
  Microscope,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Reveal } from "@/components/common/Reveal";

const ITEMS = [
  { key: "i1", Icon: Stethoscope },
  { key: "i2", Icon: HeartPulse },
  { key: "i3", Icon: Activity },
  { key: "i4", Icon: Microscope },
  { key: "i5", Icon: ClipboardCheck },
  { key: "i6", Icon: ShieldCheck },
];

export function Expertise() {
  const { t } = useI18n();
  return (
    <section id="expertise" className="scroll-mt-24 border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-semibold">
            {t("home.nav.expertise")}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("home.expertise.title")}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("home.expertise.subtitle")}
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it, index) => (
            <Reveal key={it.key} delay={index * 70} className="h-full">
              <div className="bg-card group flex h-full flex-col rounded-2xl border border-border/60 p-6 shadow-sm transition hover:shadow-md">
                <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-xl transition group-hover:scale-105">
                  <it.Icon className="size-6" />
                </div>
                <h3 className="font-semibold">
                  {t(`home.expertise.${it.key}.title`)}
                </h3>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  {t(`home.expertise.${it.key}.desc`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
