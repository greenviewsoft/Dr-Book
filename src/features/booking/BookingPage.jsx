import { useEffect, useState, useCallback } from "react";
import {
  Stethoscope,
  Clock,
  CalendarOff,
  CheckCircle2,
  CalendarX2,
  Calendar,
  HeartPulse,
  ShieldCheck,
  Zap,
  Phone,
  User,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookingForm } from "@/features/booking/components/BookingForm";
import { getDoctorConfig, getHolidays, getCounter, bookAppointment } from "@/features/booking/api";
import { todayISO, weekdayKey, computeDisplayTime, formatTime, formatLongDate } from "@/lib/datetime";

const ERROR_KEYS = {
  NOT_WORKING_DAY: "errors.notWorkingDay",
  HOLIDAY: "errors.holiday",
  PAST_DATE: "errors.pastDate",
  NO_SLOTS: "errors.noSlots",
  DUPLICATE: "errors.duplicate",
  INVALID_INPUT: "errors.generic",
  CONFIG_MISSING: "errors.configMissing",
  FAILED: "errors.generic",
};

export function BookingPage() {
  const { t, lang } = useI18n();
  const [config, setConfig] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configMissing, setConfigMissing] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [counter, setCounter] = useState(null);
  const [loadingCounter, setLoadingCounter] = useState(false);

  const [status, setStatus] = useState("idle"); // idle | submitting | success
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Load doctor config + holidays once
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingConfig(true);
      try {
        const [cfg, hol] = await Promise.all([getDoctorConfig(), getHolidays()]);
        if (!alive) return;
        setConfig(cfg);
        setHolidays(hol);
        setConfigMissing(!cfg);
      } catch {
        if (alive) setConfigMissing(true);
      } finally {
        if (alive) setLoadingConfig(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load counter (availability) for the selected date
  const refreshCounter = useCallback(async (d) => {
    if (!d) return;
    setLoadingCounter(true);
    try {
      setCounter(await getCounter(d));
    } catch {
      setCounter(null);
    } finally {
      setLoadingCounter(false);
    }
  }, []);

  useEffect(() => {
    refreshCounter(date);
  }, [date, refreshCounter]);

  // Availability for the selected date.
  // The counter column `next_serial` stores the number of serials already
  // issued for this date (0 when the row doesn't exist yet). The Function
  // bumps it atomically with incrementRowColumn(max = daily_limit).
  const weekday = date ? weekdayKey(date) : null;
  const isWorking = !!config?.working_days?.includes(weekday);
  const isHoliday = holidays.some((h) => h.date === date);
  const isPast = date < todayISO();
  const issued = counter?.next_serial ?? 0;
  const available = config
    ? Math.max(0, (config.daily_limit || 0) - issued)
    : 0;
  const nextSerial = issued + 1; // the serial the next patient will receive
  const canBook = !!config && isWorking && !isHoliday && !isPast && available > 0;
  const nextTime = config
    ? computeDisplayTime(config.daily_start, nextSerial, config.slot_duration_minutes)
    : "";

  const handleBook = async (payload) => {
    setSubmitError(null);
    setStatus("submitting");
    try {
      const res = await bookAppointment({ ...payload, date });
      setResult(res);
      setStatus("success");
      // availability changed — refresh counter
      refreshCounter(date);
    } catch (err) {
      const code = err?.code || "FAILED";
      setSubmitError(code);
      setStatus("idle");
      if (code === "NO_SLOTS" || code === "DUPLICATE") refreshCounter(date);
    }
  };

  const resetForAnother = () => {
    setResult(null);
    setStatus("idle");
    setSubmitError(null);
  };

  return (
    <div className="bg-muted/30 min-h-screen">
      {/* Header */}
      <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
            <Stethoscope className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-semibold">
              {config?.chamber_name || t("app.name")}
            </p>
            <p className="text-muted-foreground truncate text-xs leading-tight">
              {config?.specialty || t("app.tagline")}
            </p>
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-hero-medical relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <HeartPulse className="size-3.5" />
            {t("app.tagline")}
          </div>
          <h1 className="text-balance mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("booking.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            {t("booking.subtitle")}
          </p>
          {config?.name && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur">
              <User className="size-4" />
              {config.name}
              {config.specialty ? (
                <span className="text-white/80">· {config.specialty}</span>
              ) : null}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <TrustBadge icon={Zap} label={t("booking.heroBadgeInstant")} />
            <TrustBadge icon={Clock} label={t("booking.heroBadgeNoWait")} />
            <TrustBadge icon={ShieldCheck} label={t("booking.heroBadgeConfirmed")} />
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {loadingConfig ? (
          <LoadingCard label={t("common.loading")} />
        ) : configMissing ? (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="text-muted-foreground text-center">
              <CalendarX2 className="text-primary mx-auto mb-2 size-8" />
              {t("errors.configMissing")}
            </CardContent>
          </Card>
        ) : status === "success" && result ? (
          <SuccessCard result={result} onAnother={resetForAnother} />
        ) : (
          <div className="animate-fade-in-up grid gap-6">
            {/* Step 1: date */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                    1
                  </span>
                  {t("booking.stepDate")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date" className="sr-only">
                    {t("booking.dateLabel")}
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-9"
                      value={date}
                      min={todayISO()}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <DateStatus
                  isWorking={isWorking}
                  isHoliday={isHoliday}
                  isPast={isPast}
                  available={available}
                  loading={loadingCounter}
                  config={config}
                />
              </CardContent>
            </Card>

            {canBook && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                      2
                    </span>
                    {t("booking.stepDetails")}
                  </CardTitle>
                  <CardDescription>
                    {t("booking.nextSerial")}:{" "}
                    <Badge variant="secondary" className="ml-1">
                      {nextSerial}
                    </Badge>
                    {nextTime && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {t("booking.estTime")}: {formatTime(nextTime, lang)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingForm
                    onBook={handleBook}
                    submitting={status === "submitting"}
                  />
                  {submitError && (
                    <p className="text-destructive mt-3 text-center text-sm">
                      {t(ERROR_KEYS[submitError] || "errors.generic")}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Info strip */}
      {config && !configMissing && (
        <section className="mx-auto max-w-2xl px-4 pb-12">
          <div className="flex flex-wrap gap-3">
            <InfoTile icon={Clock} title={t("booking.workingHours")}>
              {formatTime(config.daily_start, lang)} –{" "}
              {formatTime(config.daily_end, lang)}
            </InfoTile>
            {config.phone && (
              <InfoTile icon={Phone} title={t("booking.contact")}>
                {config.phone}
              </InfoTile>
            )}
            <div className="border-border/60 bg-card min-w-[220px] flex-1 rounded-xl border p-4">
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                <Calendar className="size-4" /> {t("booking.workingDaysLabel")}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(config.working_days || []).map((d) => (
                  <span
                    key={d}
                    className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs font-medium"
                  >
                    {t(`days.${d}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function TrustBadge({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur sm:text-sm">
      <Icon className="size-4" />
      {label}
    </div>
  );
}

function DateStatus({
  isWorking,
  isHoliday,
  isPast,
  available,
  loading,
  config,
}) {
  const { t, lang } = useI18n();

  if (loading) {
    return (
      <div className="text-muted-foreground bg-muted/50 flex items-center gap-2 rounded-xl p-3 text-sm">
        <Clock className="size-4 animate-pulse" /> {t("common.loading")}
      </div>
    );
  }

  if (isPast) {
    return <ClosedNote icon={CalendarOff} text={t("errors.pastDate")} />;
  }
  if (isHoliday) {
    return <ClosedNote icon={CalendarOff} text={t("booking.chamberClosed")} />;
  }
  if (!isWorking) {
    return <ClosedNote icon={CalendarOff} text={t("booking.chamberClosed")} />;
  }
  if (available === 0) {
    return <ClosedNote icon={CalendarX2} text={t("booking.noSlots")} />;
  }

  return (
    <div className="border-primary/15 bg-primary/5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border p-3 text-sm">
      <span className="flex items-center gap-2">
        <Clock className="text-primary size-4" />
        {t("booking.workingHours")}:{" "}
        <span className="font-medium">
          {formatTime(config?.daily_start, lang)} –{" "}
          {formatTime(config?.daily_end, lang)}
        </span>
      </span>
      <Badge variant="success">
        {t("booking.slotsAvailable", { count: available })}
      </Badge>
    </div>
  );
}

function ClosedNote({ icon: Icon, text }) {
  return (
    <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-xl p-3 text-sm font-medium">
      <Icon className="size-4 shrink-0" />
      {text}
    </div>
  );
}

function SuccessCard({ result, onAnother }) {
  const { t, lang } = useI18n();
  return (
    <Card className="animate-fade-in-up overflow-hidden text-center">
      <div className="bg-hero-medical relative px-6 py-8 text-white">
        <div className="bg-white/15 mx-auto mb-3 flex size-14 items-center justify-center rounded-full backdrop-blur">
          <CheckCircle2 className="size-8" />
        </div>
        <CardTitle className="text-xl">{t("booking.successTitle")}</CardTitle>
        <p className="mt-1 text-sm text-white/85">{t("booking.successMsg")}</p>
      </div>
      <CardContent className="grid gap-4 p-6">
        <div className="bg-muted/50 grid grid-cols-3 gap-2 rounded-xl p-4">
          <Stat label={t("booking.successSerial")} value={`#${result.serial}`} highlight />
          <Stat
            label={t("booking.successTime")}
            value={result.displayTime ? formatTime(result.displayTime, lang) : "—"}
          />
          <Stat
            label={t("booking.successDate")}
            value={formatLongDate(result.date, lang)}
            small
          />
        </div>
        <p className="text-muted-foreground text-sm">{t("booking.successNote")}</p>
        <Button onClick={onAnother} variant="outline" className="mx-auto">
          {t("booking.another")}
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight, small }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={
          highlight
            ? "text-primary text-2xl font-bold"
            : small
            ? "text-sm font-medium"
            : "text-lg font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}

function InfoTile({ icon: Icon, title, children }) {
  return (
    <div className="border-border/60 bg-card min-w-[160px] rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
        <Icon className="size-4" /> {title}
      </div>
      <div className="mt-1 font-semibold">{children}</div>
    </div>
  );
}

function LoadingCard({ label }) {
  return (
    <Card className="border-border/60 overflow-hidden shadow-sm">
      <CardContent className="space-y-3 p-6">
        <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
        <div className="bg-muted h-10 animate-pulse rounded" />
        <div className="bg-muted h-4 w-1/4 animate-pulse rounded" />
        <div className="bg-muted h-24 animate-pulse rounded" />
        <div className="text-muted-foreground pt-1 text-center text-sm">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
