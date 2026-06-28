import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Inbox } from "lucide-react";
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
  updateAppointmentStatus,
  getDoctorConfig,
} from "@/features/admin/api";
import { todayISO, computeDisplayTime, formatTime } from "@/lib/datetime";

const STATUS_VARIANT = {
  pending: "warning",
  approved: "default",
  completed: "success",
  cancelled: "destructive",
};

export function DashboardPage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, cfg] = await Promise.all([
        listAppointmentsByDate(todayISO()),
        getDoctorConfig(),
      ]);
      setItems(rows);
      setConfig(cfg);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("admin.nav.dashboard")}</h1>
          <p className="text-muted-foreground text-sm">
            {new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          {loading ? t("common.loading") : t("common.refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label={t("admin.stats.total")} value={stats.total} />
        <StatCard label={t("admin.stats.pending")} value={stats.pending} />
        <StatCard label={t("admin.stats.approved")} value={stats.approved} />
        <StatCard label={t("admin.stats.completed")} value={stats.completed} />
        <StatCard label={t("admin.stats.cancelled")} value={stats.cancelled} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("admin.nav.dashboard")}</CardTitle>
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
