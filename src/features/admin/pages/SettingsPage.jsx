import { useEffect, useState } from "react";
import { Loader2, Save, Check, Upload, Image as ImageIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  getDoctorConfig,
  updateDoctorConfig,
  createDoctorConfig,
  uploadSiteImage,
} from "@/features/admin/api";
import { useAuth } from "@/features/admin/hooks/useAuth";
import { WEEKDAYS } from "@/lib/constants";

// Defaults used when no doctor settings row exists yet, so the doctor can
// create the first one from this page instead of seeding it in the console.
const DEFAULT_FORM = {
  name: "",
  specialty: "",
  chamber_name: "",
  phone: "",
  address: "",
  daily_limit: 30,
  daily_start: "10:00",
  daily_end: "13:00",
  slot_duration_minutes: 10,
  working_days: ["sat", "sun", "mon", "tue", "wed"],
  logo: "",
  favicon: "",
  photo: "",
};

function configToForm(cfg) {
  return {
    name: cfg.name || "",
    specialty: cfg.specialty || "",
    chamber_name: cfg.chamber_name || "",
    phone: cfg.phone || "",
    address: cfg.address || "",
    daily_limit: cfg.daily_limit ?? 30,
    daily_start: cfg.daily_start || "10:00",
    daily_end: cfg.daily_end || "13:00",
    slot_duration_minutes: cfg.slot_duration_minutes ?? 10,
    working_days: cfg.working_days || ["sat", "sun", "mon", "tue", "wed"],
    logo: cfg.logo || "",
    favicon: cfg.favicon || "",
    photo: cfg.photo || "",
  };
}

export function SettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rowId, setRowId] = useState(null);
  const [form, setForm] = useState(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, favicon: false, photo: false });

  useEffect(() => {
    (async () => {
      try {
        const cfg = await getDoctorConfig();
        if (cfg) {
          setRowId(cfg.$id);
          setForm(configToForm(cfg));
        } else {
          // No settings yet — show the form so the doctor can create them.
          setRowId(null);
          setForm({ ...DEFAULT_FORM });
        }
      } catch {
        setMissing(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key) => (e) => {
    const val =
      e && e.target
        ? e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value
        : e;
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
  };

  const toggleDay = (day) => {
    setForm((f) => {
      const has = f.working_days.includes(day);
      return {
        ...f,
        working_days: has
          ? f.working_days.filter((d) => d !== day)
          : [...f.working_days, day],
      };
    });
    setSaved(false);
  };

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [key]: true }));
    setSaved(false);
    try {
      const { url } = await uploadSiteImage(file);
      setForm((f) => ({ ...f, [key]: url }));
    } catch {
      /* ignore — preview stays unchanged */
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving || !form) return;
    // Creating the first row needs the doctor's $id to scope edit permissions.
    if (!rowId && !user?.$id) return;
    setSaving(true);
    setSaved(false);
    try {
      if (rowId) {
        await updateDoctorConfig(rowId, form);
      } else {
        const created = await createDoctorConfig(form, user.$id);
        setRowId(created.$id); // further saves update instead of duplicating
      }
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
      </div>
    );
  }

  if (missing) {
    return (
      <Card>
        <CardContent className="text-muted-foreground text-sm">
          {t("errors.configMissing")}
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSave} className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">{t("admin.settings.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("admin.settings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.settings.doctor")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.settings.name")}>
            <Input value={form.name} onChange={set("name")} />
          </Field>
          <Field label={t("admin.settings.specialty")}>
            <Input value={form.specialty} onChange={set("specialty")} />
          </Field>
          <Field label={t("admin.settings.chamber")}>
            <Input value={form.chamber_name} onChange={set("chamber_name")} />
          </Field>
          <Field label={t("admin.settings.phone")}>
            <Input value={form.phone} onChange={set("phone")} />
          </Field>
          <ImageField
            label={t("admin.settings.profilePhoto")}
            value={form.photo}
            uploading={uploading.photo}
            onPick={(f) => handleUpload("photo", f)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.settings.schedule")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.settings.dailyLimit")}>
            <Input
              type="number"
              min={1}
              value={form.daily_limit}
              onChange={set("daily_limit")}
            />
          </Field>
          <Field label={t("admin.settings.slotDuration")}>
            <Input
              type="number"
              min={1}
              value={form.slot_duration_minutes}
              onChange={set("slot_duration_minutes")}
            />
          </Field>
          <Field label={t("admin.settings.startTime")}>
            <Input type="time" value={form.daily_start} onChange={set("daily_start")} />
          </Field>
          <Field label={t("admin.settings.endTime")}>
            <Input type="time" value={form.daily_end} onChange={set("daily_end")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.settings.workingDays")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const active = form.working_days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  {t(`days.${day}`)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.settings.branding")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.settings.address")}>
            <Input value={form.address} onChange={set("address")} />
          </Field>
          <ImageField
            label={t("admin.settings.logo")}
            value={form.logo}
            uploading={uploading.logo}
            onPick={(f) => handleUpload("logo", f)}
          />
          <ImageField
            label={t("admin.settings.favicon")}
            value={form.favicon}
            uploading={uploading.favicon}
            onPick={(f) => handleUpload("favicon", f)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? t("common.saving") : t("admin.settings.save")}
        </Button>
        {saved && (
          <span className="text-success flex items-center gap-1 text-sm">
            <Check className="size-4" /> {t("admin.settings.saved")}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ImageField({ label, value, uploading, onPick }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {value ? (
            <img src={value} alt="" className="size-full object-contain" />
          ) : (
            <ImageIcon className="text-muted-foreground size-5" />
          )}
        </div>
        <label
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "cursor-pointer",
          )}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? t("admin.settings.uploading") : t("admin.settings.upload")}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
