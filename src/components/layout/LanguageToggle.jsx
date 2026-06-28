import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className, variant = "outline" }) {
  const { lang, toggle } = useI18n();
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={toggle}
      className={cn(className)}
    >
      <Languages className="size-4" />
      {lang === "bn" ? "EN" : "বাংলা"}
    </Button>
  );
}
