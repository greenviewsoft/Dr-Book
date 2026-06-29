import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Inbox, AlertTriangle, Download } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAppointmentsByDate,
  listAppointmentsByMonth,
  updateAppointmentStatus,
  getDoctorConfig,
} from "@/features/admin/api";
import { todayISO, computeDisplayTime, formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const STATUS_VARIANT = {
  pending: "warning",
  approved: "default",
  completed: "success",
  cancelled: "destructive",
};

const MODES = ["today", "day", "month"];

export function DashboardPage() {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState("today");
  const [day, setDay] = useState(todayISO());
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [rows, cfg] = await Promise.all([
        mode === "month"
          ? listAppointmentsByMonth(month)
          : listAppointmentsByDate(mode === "today" ? todayISO() : day),
        getDoctorConfig(),
      ]);
      // Sort client-side so a missing index can't blank the list.
      setItems(
        [...rows].sort((a, b) => {
          const da = a.appointment_date || "";
          const dbb = b.appointment_date || "";
          if (da !== dbb) return da < dbb ? -1 : 1;
          return (a.serial_number || 0) - (b.serial_number || 0);
        }),
      );
      setConfig(cfg);
    } catch (e) {
      setItems([]);
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [mode, day, month]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (rowId, status) => {
    setBusyId(rowId);
    try {
      await updateAppointmentStatus(rowId, status);
      setItems((prev) =>
        prev.map((r) => (r.$id === rowId ? { ...r, status } : r))
      );
    } catch {
      // ignore — keep current state
    } finally {
      setBusyId(null);
    }
  };

  const stats = {
    total: items.length,
    pending: items.filter((r) => r.status === "pending").length,
    approved: items.filter((r) => r.status === "approved").length,
    completed: items.filter((r) => r.status === "completed").length,
    cancelled: items.filter((r) => r.status === "cancelled").length,
  };

  const slotMinutes = config?.slot_duration_minutes || 0;

  const title =
    mode === "month"
      ? t("admin.report.monthlyTitle")
      : mode === "day"
        ? t("admin.report.dailyTitle")
        : t("admin.nav.dashboard");

  const periodLabel =
    mode === "month"
      ? new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
          month: "long",
          year: "numeric",
        }).format(
          new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1),
        )
      : new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(
          new Date((mode === "today" ? todayISO() : day) + "T00:00:00"),
        );

  const handleExport = () => {
    if (!items.length) return;
    const head = [
      "Serial",
      "Name",
      "Phone",
      "Age",
      "Date",
      "Time",
      "Status",
    ];
    const body = items.map((r) => [
      r.serial_number,
      r.patient_name,
      r.patient_phone,
      r.patient_age,
      r.appointment_date,
      slotMinutes && config?.daily_start
        ? computeDisplayTime(config.daily_start, r.serial_number, slotMinutes)
        : "",
      r.status,
    ]);
    const csv = [head, ...body]
      .map((row) =>
        row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments-${
      mode === "month" ? month : mode === "today" ? todayISO() : day
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-muted-foreground text-sm">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!items.length}
          >
            <Download className="size-4" /> {t("admin.report.exportCsv")}
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            {loading ? t("common.loading") : t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* Mode tabs + pickers */}
      <div className="flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:bg-accent",
            )}
          >
            {t(`admin.report.${m}`)}
          </button>
        ))}
        {mode === "day" && (
          <Input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-auto"
          />
        )}
        {mode === "month" && (
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-auto"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label={t("admin.stats.total")} value={stats.total} />
        <StatCard label={t("admin.stats.pending")} value={stats.pending} />
        <StatCard label={t("admin.stats.approved")} value={stats.approved} />
        <StatCard label={t("admin.stats.completed")} value={stats.completed} />
        <StatCard label={t("admin.stats.cancelled")} value={stats.cancelled} />
      </div>

      {err && (
        <div className="text-destructive bg-destructive/10 flex items-start gap-2 rounded-lg p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span className="break-words">{err}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{t("admin.table.empty")}</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
              <Inbox className="size-8" />
              {t("admin.table.empty")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.table.serial")}</TableHead>
                  {mode === "month" && (
                    <TableHead className="whitespace-nowrap">
                      {t("booking.dateLabel")}
                    </TableHead>
                  )}
                  <TableHead>{t("admin.table.name")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {t("admin.table.phone")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("admin.table.age")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("admin.table.estTime")}
                  </TableHead>
                  <TableHead>{t("admin.table.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("admin.table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => {
                  const est =
                    slotMinutes && config?.daily_start
                      ? formatTime(
                          computeDisplayTime(
                            config.daily_start,
                            r.serial_number,
                            slotMinutes
                          ),
                          lang
                        )
                      : "—";
                  return (
                    <TableRow key={r.$id}>
                      <TableCell className="font-medium">#{r.serial_number}</TableCell>
                      {mode === "month" && (
                        <TableCell className="whitespace-nowrap">
                          {r.appointment_date}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="font-medium">{r.patient_name}</div>
                        <div className="text-muted-foreground text-xs sm:hidden">
                          {r.patient_phone}
                        </div>
                        {r.problem && (
                          <div className="text-muted-foreground mt-0.5 hidden max-w-[16rem] truncate text-xs lg:block">
                            {r.problem}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {r.patient_phone}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {r.patient_age}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{est}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]}>
                          {t(`admin.status.${r.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(r.status === "pending" || r.status === "approved") && (
                            <>
                              {r.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  disabled={busyId === r.$id}
                                  onClick={() => changeStatus(r.$id, "approved")}
                                >
                                  {t("admin.actions.approve")}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === r.$id}
                                onClick={() => changeStatus(r.$id, "completed")}
                              >
                                {t("admin.actions.complete")}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busyId === r.$id}
                                onClick={() => changeStatus(r.$id, "cancelled")}
                              >
                                {t("admin.actions.cancel")}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-muted-foreground text-xs">{label}</div>
      </CardContent>
    </Card>
  );
}
