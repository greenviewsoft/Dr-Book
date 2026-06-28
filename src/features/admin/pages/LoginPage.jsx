import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/features/admin/hooks/useAuth";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch {
      setError("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-end px-4">
        <LanguageToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <ShieldCheck className="text-primary mx-auto size-10" />
            <CardTitle className="mt-2">{t("admin.login.title")}</CardTitle>
            <CardDescription>{t("admin.login.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("admin.login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("admin.login.emailPh")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{t("admin.login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("admin.login.passwordPh")}
                />
              </div>

              {error && (
                <p className="text-destructive text-center text-sm">
                  {t("admin.login.failed")}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {loading ? t("admin.login.submitting") : t("admin.login.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
