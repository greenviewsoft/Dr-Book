import { useState } from "react";
import { Loader2, CalendarPlus } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function isBdPhone(v) {
  return /^01\d{9}$/.test(v.replace(/[\s-]/g, ""));
}

export function BookingForm({ onBook, submitting, disabled }) {
  const { t } = useI18n();
  const [values, setValues] = useState({
    name: "",
    phone: "",
    age: "",
    problem: "",
  });
  const [errors, setErrors] = useState({});

  const update = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    const name = values.name.trim();
    const phone = values.phone.trim().replace(/[\s-]/g, "");
    const age = Number(values.age);

    if (!name) next.name = "errors.nameRequired";
    if (!phone) next.phone = "errors.phoneRequired";
    else if (!isBdPhone(phone)) next.phone = "errors.phoneInvalid";
    if (values.age === "" || Number.isNaN(age) || age < 0 || age > 150)
      next.age = "errors.ageInvalid";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || submitting) return;
    if (!validate()) return;
    onBook({
      name: values.name.trim(),
      phone: values.phone.trim().replace(/[\s-]/g, ""),
      age: Number(values.age),
      problem: values.problem.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("booking.name")}</Label>
        <Input
          id="name"
          value={values.name}
          onChange={update("name")}
          placeholder={t("booking.namePh")}
          aria-invalid={!!errors.name}
          disabled={disabled}
        />
        {errors.name && (
          <p className="text-destructive text-xs">{t(errors.name)}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">{t("booking.phone")}</Label>
        <Input
          id="phone"
          inputMode="numeric"
          value={values.phone}
          onChange={update("phone")}
          placeholder={t("booking.phonePh")}
          aria-invalid={!!errors.phone}
          disabled={disabled}
        />
        {errors.phone && (
          <p className="text-destructive text-xs">{t(errors.phone)}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="age">{t("booking.age")}</Label>
        <Input
          id="age"
          type="number"
          min={0}
          max={150}
          value={values.age}
          onChange={update("age")}
          placeholder={t("booking.agePh")}
          aria-invalid={!!errors.age}
          disabled={disabled}
        />
        {errors.age && (
          <p className="text-destructive text-xs">{t(errors.age)}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="problem">
          {t("booking.problem")}{" "}
          <span className="text-muted-foreground font-normal">
            ({t("common.optional")})
          </span>
        </Label>
        <Textarea
          id="problem"
          value={values.problem}
          onChange={update("problem")}
          placeholder={t("booking.problemPh")}
          rows={3}
          disabled={disabled}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={disabled || submitting}
        className="w-full"
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CalendarPlus className="size-4" />
        )}
        {submitting ? t("booking.submitting") : t("booking.submit")}
      </Button>
    </form>
  );
}
