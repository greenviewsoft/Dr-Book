import { useEffect, useState, useCallback } from "react";
import { Loader2, Trash2, CalendarPlus, CalendarOff } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/features/admin/hooks/useAuth";
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
import { listHolidays, addHoliday, deleteHoliday } from "@/features/admin/api";
import { todayISO, formatLongDate } from "@/lib/datetime";

export function HolidaysPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listHolidays());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (adding || !date) return;
    setError(null);
    setAdding(true);
    try {
      await addHoliday(date, reason, user?.$id);
      setReason("");
      await load();
    } catch {
      setError("errors.generic");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (rowId) => {
    try {
      await deleteHoliday(rowId);
      setItems((prev) => prev.filter((r) => r.$id !== rowId));
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">{t("admin.holidays.title")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("admin.holidays.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.holidays.addBtn")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <Label htmlFor="hdate">{t("admin.holidays.date")}</Label>
              <Input
                id="hdate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hreason">
                {t("admin.holidays.reason")}{" "}
                <span className="text-muted-foreground font-normal">
                  ({t("common.optional")})
                </span>
              </Label>
              <Input
                id="hreason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("admin.holidays.reasonPh")}
              />
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CalendarPlus className="size-4" />
              )}
              {t("common.add")}
            </Button>
          </form>
          {error && (
            <p className="text-destructive mt-2 text-sm">{t(error)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.holidays.title")}</CardTitle>
          <CardDescription>{t("admin.holidays.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> {t("common.loading")}
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <CalendarOff className="size-5" /> {t("admin.holidays.empty")}
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((h) => (
                <li
                  key={h.$id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <div className="font-medium">
                      {formatLongDate(h.date, lang)}
                    </div>
                    {h.reason && (
                      <div className="text-muted-foreground text-sm">
                        {h.reason}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(h.$id)}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
